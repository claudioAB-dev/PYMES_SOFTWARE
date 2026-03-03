"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { orders, orderItems, memberships, products, entities, payments, inventoryMovements, financialAccounts, treasuryTransactions } from "@/db/schema";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { createOrderSchema, CreateOrderInput } from "@/lib/validators/orders";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// --- Data Fetching ---

export async function getCustomers() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });
    if (userMemberships.length === 0) return [];
    const organizationId = userMemberships[0].organizationId;

    // Fetch clients (or both)
    return await db.query.entities.findMany({
        where: and(
            eq(entities.organizationId, organizationId),
            inArray(entities.type, ['CLIENT', 'BOTH'])
        ),
        orderBy: [desc(entities.createdAt)],
    });
}

export async function getProducts() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });
    if (userMemberships.length === 0) return [];
    const organizationId = userMemberships[0].organizationId;

    return await db.query.products.findMany({
        where: eq(products.organizationId, organizationId),
        orderBy: [desc(products.createdAt)],
    });
}

// --- Mutations ---

export async function createOrder(input: CreateOrderInput) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autorizado" };
    }

    const validatedFields = createOrderSchema.safeParse(input);

    if (!validatedFields.success) {
        return { error: "Datos inválidos: " + validatedFields.error.message };
    }

    const { entityId, status, items } = validatedFields.data;

    // Get Organization
    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) {
        return { error: "No se encontró organización activa" };
    }
    const organizationId = userMemberships[0].organizationId;
    const userRole = userMemberships[0].role;

    // --- Validate Credit Limit (Only for Sales) ---
    // Calculate new order total to check against credit 
    let orderSubtotal = 0;
    for (const item of items) {
        orderSubtotal += item.quantity * item.price;
    }
    const newOrderTotal = orderSubtotal * 1.16; // 16% IVA

    const entity = await db.query.entities.findFirst({
        where: and(eq(entities.id, entityId), eq(entities.organizationId, organizationId))
    });

    if (!entity) {
        return { error: "Cliente no encontrado" };
    }

    if (Number(entity.creditLimit) > 0) {
        const activeOrders = await db.query.orders.findMany({
            where: and(
                eq(orders.entityId, entityId),
                eq(orders.organizationId, organizationId),
                inArray(orders.paymentStatus, ['UNPAID', 'PARTIAL']),
                inArray(orders.status, ['DRAFT', 'CONFIRMED'])
            ),
            with: {
                payments: true
            }
        });

        let currentBalance = 0;
        for (const o of activeOrders) {
            const orderAmount = Number(o.totalAmount);
            const paidAmount = o.payments.reduce((sum, p) => sum + Number(p.amount), 0);
            currentBalance += (orderAmount - paidAmount);
        }

        if ((currentBalance + newOrderTotal) > Number(entity.creditLimit)) {
            if (userRole !== 'OWNER') {
                return { error: `Límite de crédito excedido. Saldo actual: $${currentBalance.toFixed(2)}. Límite: $${Number(entity.creditLimit).toFixed(2)}.` };
            }
        }
    }

    const productIds = items.map(i => i.productId);

    try {
        await db.transaction(async (tx) => {
            // Fetch products inside transaction to ensure consistent data and stock validation
            const dbProducts = await tx.query.products.findMany({
                where: and(inArray(products.id, productIds), eq(products.organizationId, organizationId)),
            });
            const productMap = new Map(dbProducts.map(p => [p.id, p]));

            // 1. Calculate Server-Side Totals
            let subtotal = 0;
            for (const item of items) {
                subtotal += item.quantity * item.price;
            }

            const taxRate = 0.16;
            const retentionRate = 0.0125;
            const totalTaxAmount = subtotal * taxRate;
            const totalRetentionAmount = subtotal * retentionRate;
            const totalAmount = subtotal + totalTaxAmount - totalRetentionAmount;

            // 2. Create Order Header with totals
            const [newOrder] = await tx.insert(orders).values({
                organizationId,
                entityId,
                status,
                type: 'SALE',
                subtotalAmount: subtotal.toFixed(2),
                totalTaxAmount: totalTaxAmount.toFixed(2),
                totalRetentionAmount: totalRetentionAmount.toFixed(2),
                totalAmount: totalAmount.toFixed(2),
            }).returning({ id: orders.id });

            // 3. Insert Order Items & Deduct Stock
            for (const item of items) {
                const product = productMap.get(item.productId);
                if (!product) {
                    throw new Error(`Producto no encontrado: ${item.productId}`);
                }

                // Check stock (Validation inside transaction)
                if (status === 'CONFIRMED' && product.type === 'PRODUCT') {
                    const currentStock = Number(product.stock);
                    if (currentStock < item.quantity) {
                        // Throws error to rollback the transaction cleanly and return error
                        throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${currentStock}, Solicitado: ${item.quantity}`);
                    }
                }

                const itemTotal = item.quantity * item.price;
                const itemTax = itemTotal * taxRate;
                const itemRetention = itemTotal * retentionRate;

                // Insert into orderItems with tax and retention
                await tx.insert(orderItems).values({
                    orderId: newOrder.id,
                    productId: item.productId,
                    quantity: item.quantity.toString(),
                    unitPrice: item.price.toString(),
                    taxAmount: itemTax.toFixed(2),
                    retentionAmount: itemRetention.toFixed(2),
                });

                // Deduct stock if it's a confirmed sale and a product
                if (status === 'CONFIRMED' && product.type === 'PRODUCT') {
                    const [updated] = await tx.update(products)
                        .set({ stock: sql`${products.stock} - ${item.quantity}` })
                        .where(and(eq(products.id, item.productId), eq(products.organizationId, organizationId)))
                        .returning({ stock: products.stock });

                    const newStock = Number(updated.stock);
                    const previousStock = newStock + item.quantity;

                    // Insert movement
                    await tx.insert(inventoryMovements).values({
                        organizationId,
                        productId: item.productId,
                        type: 'OUT_SALE',
                        quantity: item.quantity.toString(),
                        previousStock: previousStock.toString(),
                        newStock: newStock.toString(),
                        referenceId: newOrder.id,
                        createdBy: user.id
                    });
                }
            }
        });

        // 4. Revalidate
        revalidatePath("/dashboard/orders");
        return { success: true };

    } catch (error: any) {
        console.error("Error creating order:", error);
        // Custom error messages thrown inside the transaction
        if (error.message && (error.message.includes("Stock insuficiente") || error.message.includes("Producto no encontrado"))) {
            return { error: error.message };
        }
        return { error: "Error al crear la orden. Por favor intente de nuevo." };
    }
}

export async function deleteOrder(orderId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autorizado" };
    }

    // Get Organization (Simplified check, ideally should use middleware or context)
    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) return { error: "No organization found" };
    const organizationId = userMemberships[0].organizationId;

    try {
        await db.transaction(async (tx) => {
            // 1. Get Order and Items to check status and restore stock
            const order = await tx.query.orders.findFirst({
                where: and(eq(orders.id, orderId), eq(orders.organizationId, organizationId)),
                with: {
                    items: {
                        with: {
                            product: true,
                        }
                    }
                }
            });

            if (!order) return;

            // 2. Restore Stock only if it was CONFIRMED
            if (order.status === 'CONFIRMED') {
                for (const item of order.items) {
                    if (item.product.type === 'PRODUCT') {
                        // Ensure numeric addition even if quantity is string
                        const [updated] = await tx.update(products)
                            .set({ stock: sql`${products.stock} + ${Number(item.quantity)}` })
                            .where(and(eq(products.id, item.productId), eq(products.organizationId, organizationId)))
                            .returning({ stock: products.stock });

                        const newStock = Number(updated.stock);
                        const previousStock = newStock - Number(item.quantity);

                        await tx.insert(inventoryMovements).values({
                            organizationId,
                            productId: item.productId,
                            type: 'IN_RETURN',
                            quantity: item.quantity.toString(),
                            previousStock: previousStock.toString(),
                            newStock: newStock.toString(),
                            referenceId: orderId,
                            notes: "Order deleted",
                            createdBy: user.id
                        });
                    }
                }
            }

            // 3. Delete Order Items
            await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));

            // 4. Delete Order
            await tx.delete(orders).where(and(eq(orders.id, orderId), eq(orders.organizationId, organizationId)));
        });

        revalidatePath("/dashboard/orders");
        return { success: true };
    } catch (error) {
        console.error("Error deleting order:", error);
        return { error: "Error al eliminar la orden" };
    }
}

export async function getOrderDetails(orderId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Validate UUID format to prevent DB errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
        return null;
    }

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) return null;
    const organizationId = userMemberships[0].organizationId;

    const order = await db.query.orders.findFirst({
        where: and(
            eq(orders.id, orderId),
            eq(orders.organizationId, organizationId)
        ),
        with: {
            entity: true,
            items: {
                with: {
                    product: true,
                }
            },
            payments: {
                orderBy: [desc(payments.date)],
            },
        },
    });

    return order;
}


export async function updateOrderStatus(orderId: string, newStatus: 'CONFIRMED' | 'CANCELLED') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autorizado" };
    }

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) return { error: "No organization found" };
    const organizationId = userMemberships[0].organizationId;

    try {
        await db.transaction(async (tx) => {
            // 1. Get current order status
            const order = await tx.query.orders.findFirst({
                where: and(
                    eq(orders.id, orderId),
                    eq(orders.organizationId, organizationId)
                ),
                with: {
                    items: {
                        with: {
                            product: true
                        }
                    }
                }
            });

            if (!order) throw new Error("Orden no encontrada");

            // 2. Handle Transitions
            // Restore Stock if transitioning FROM CONFIRMED TO CANCELLED
            if (newStatus === 'CANCELLED' && order.status === 'CONFIRMED') {
                for (const item of order.items) {
                    if (item.product.type === 'PRODUCT') {
                        const [updated] = await tx.update(products)
                            .set({ stock: sql`${products.stock} + ${Number(item.quantity)}` })
                            .where(and(eq(products.id, item.productId), eq(products.organizationId, organizationId)))
                            .returning({ stock: products.stock });

                        const newStock = Number(updated.stock);
                        const previousStock = newStock - Number(item.quantity);

                        await tx.insert(inventoryMovements).values({
                            organizationId,
                            productId: item.productId,
                            type: 'IN_RETURN',
                            quantity: item.quantity.toString(),
                            previousStock: previousStock.toString(),
                            newStock: newStock.toString(),
                            referenceId: orderId,
                            notes: "Order cancelled",
                            createdBy: user.id
                        });
                    }
                }
            }

            // Deduct Stock if transitioning FROM CANCELLED/DRAFT TO CONFIRMED
            if ((order.status === 'CANCELLED' || order.status === 'DRAFT') && newStatus === 'CONFIRMED') {
                // Check and Deduct Stock
                for (const item of order.items) {
                    if (item.product.type === 'PRODUCT') {
                        const currentStock = Number(item.product.stock);
                        if (currentStock < Number(item.quantity)) {
                            throw new Error(`Stock insuficiente para producto: ${item.product.name}`);
                        }

                        const [updated] = await tx.update(products)
                            .set({ stock: sql`${products.stock} - ${Number(item.quantity)}` })
                            .where(and(eq(products.id, item.productId), eq(products.organizationId, organizationId)))
                            .returning({ stock: products.stock });

                        const newStock = Number(updated.stock);
                        const previousStock = newStock + Number(item.quantity);

                        await tx.insert(inventoryMovements).values({
                            organizationId,
                            productId: item.productId,
                            type: 'OUT_SALE',
                            quantity: item.quantity.toString(),
                            previousStock: previousStock.toString(),
                            newStock: newStock.toString(),
                            referenceId: orderId,
                            notes: order.status === 'DRAFT' ? "Quote converted to sale" : "Order reactivated",
                            createdBy: user.id
                        });
                    }
                }
            }

            // 3. Update Status
            await tx.update(orders)
                .set({ status: newStatus })
                .where(and(eq(orders.id, orderId), eq(orders.organizationId, organizationId)));
        });

        revalidatePath(`/dashboard/orders/${orderId}`);
        revalidatePath("/dashboard/orders");
        return { success: true };

    } catch (error: any) {
        console.error("Error updating order status:", error);
        return { error: error.message || "Error al actualizar estado" };
    }
}

export async function createQuickClient(data: { commercialName: string, taxId?: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autorizado" };
    }

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) return { error: "No organization found" };
    const organizationId = userMemberships[0].organizationId;

    try {
        const [newEntity] = await db.insert(entities).values({
            organizationId,
            type: 'CLIENT',
            commercialName: data.commercialName,
            taxId: data.taxId || null,
        }).returning({ id: entities.id, commercialName: entities.commercialName });

        revalidatePath("/dashboard/orders/new");
        revalidatePath("/dashboard/orders");
        return { success: true, data: newEntity };
    } catch (error: any) {
        console.error("Error creating quick client:", error);
        return { error: "Error al crear el cliente. Es posible que el RFC ya esté en uso." };
    }
}
