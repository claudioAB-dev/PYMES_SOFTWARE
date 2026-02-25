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
        where: eq(entities.id, entityId)
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

    // --- Validate Stock ---
    const productIds = items.map(i => i.productId);
    const dbProducts = await db.query.products.findMany({
        where: inArray(products.id, productIds),
    });

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
            return { error: `Producto no encontrado: ${item.productId}` };
        }

        if (product.type === 'PRODUCT') {
            const currentStock = Number(product.stock);
            if (currentStock < item.quantity) {
                return { error: `Stock insuficiente para ${product.name}. Disponible: ${currentStock}, Solicitado: ${item.quantity}` };
            }
        }
    }

    try {
        await db.transaction(async (tx) => {
            // 1. Create Order Header
            const [newOrder] = await tx.insert(orders).values({
                organizationId,
                entityId,
                status,
                type: 'SALE',
                totalAmount: '0',
            }).returning({ id: orders.id });

            // 2. Insert Order Items & Calculate Totals & Deduct Stock
            let subtotal = 0;

            for (const item of items) {
                const itemTotal = item.quantity * item.price;
                subtotal += itemTotal;

                await tx.insert(orderItems).values({
                    orderId: newOrder.id,
                    productId: item.productId,
                    quantity: item.quantity.toString(),
                    unitPrice: item.price.toString(),
                });

                // Deduct stock if it's a product
                const product = productMap.get(item.productId);
                if (product && product.type === 'PRODUCT') {
                    const [updated] = await tx.update(products)
                        .set({ stock: sql`${products.stock} - ${item.quantity}` })
                        .where(eq(products.id, item.productId))
                        .returning({ stock: products.stock });

                    const newStock = Number(updated.stock);
                    const previousStock = newStock + item.quantity;

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

            // 3. Calculate Final Totals (IVA 16%)
            const taxRate = 0.16;
            const tax = subtotal * taxRate;
            const total = subtotal + tax;

            // 4. Update Order with Total
            await tx.update(orders)
                .set({ totalAmount: total.toFixed(2) })
                .where(eq(orders.id, newOrder.id));
        });

        // 5. Revalidate
        revalidatePath("/dashboard/orders");
        return { success: true };

    } catch (error) {
        console.error("Error creating order:", error);
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
            // 1. Get Order Items to restore stock
            const items = await tx.query.orderItems.findMany({
                where: eq(orderItems.orderId, orderId),
                with: {
                    product: true,
                }
            });

            // 2. Restore Stock
            for (const item of items) {
                if (item.product.type === 'PRODUCT') {
                    // Ensure numeric addition even if quantity is string
                    const [updated] = await tx.update(products)
                        .set({ stock: sql`${products.stock} + ${Number(item.quantity)}` })
                        .where(eq(products.id, item.productId))
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

export async function registerPayment(orderId: string, amount: number, method: 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER', accountId: string, reference?: string) {
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
            // 1. Get Order & Existing Payments
            const order = await tx.query.orders.findFirst({
                where: and(
                    eq(orders.id, orderId),
                    eq(orders.organizationId, organizationId)
                ),
                with: {
                    payments: true,
                }
            });

            if (!order) throw new Error("Orden no encontrada");

            // 2. Validate Amount
            const totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
            const pendingBalance = Number(order.totalAmount) - totalPaid;

            if (amount > pendingBalance) {
                // Allow a small margin of error for floating point issues if specific implementation needed, but generally stick to strict for money.
                // However, for user experience, let's just reject.
                throw new Error(`El monto excede el saldo pendiente. Saldo: ${pendingBalance.toFixed(2)}`);
            }

            if (amount <= 0) {
                throw new Error("El monto debe ser mayor a 0");
            }

            // 2.5 Verify Account
            const account = await tx.query.financialAccounts.findFirst({
                where: and(
                    eq(financialAccounts.id, accountId),
                    eq(financialAccounts.organizationId, organizationId)
                )
            });

            if (!account) throw new Error("Cuenta financiera no encontrada");

            // 3. Register Payment
            await tx.insert(payments).values({
                organizationId,
                orderId,
                amount: amount.toString(),
                method,
                reference,
            });

            // 3.5 Update Treasury
            await tx.insert(treasuryTransactions).values({
                organizationId,
                accountId,
                type: 'INCOME',
                category: 'SALE',
                amount: amount.toString(),
                referenceId: orderId,
                description: reference ? `Pago venta: ${reference}` : `Pago venta: ${orderId.substring(0, 8)}`,
                createdBy: user.id,
            });

            await tx.update(financialAccounts)
                .set({ balance: sql`${financialAccounts.balance} + ${amount}` })
                .where(eq(financialAccounts.id, accountId));

            // 4. Update Order Status
            const newTotalPaid = totalPaid + amount;
            const orderTotal = Number(order.totalAmount);

            let newStatus: 'UNPAID' | 'PARTIAL' | 'PAID' = 'PARTIAL';
            if (newTotalPaid >= orderTotal - 0.01) { // Tolerance for rounding
                newStatus = 'PAID';
            } else if (newTotalPaid > 0) {
                newStatus = 'PARTIAL';
            } else {
                newStatus = 'UNPAID';
            }

            await tx.update(orders)
                .set({ paymentStatus: newStatus })
                .where(eq(orders.id, orderId));
        });

        revalidatePath(`/dashboard/orders/${orderId}`);
        revalidatePath("/dashboard/orders");
        return { success: true };

    } catch (error: any) {
        console.error("Error registering payment:", error);
        return { error: error.message || "Error al registrar pago" };
    }
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
            if (newStatus === 'CANCELLED' && order.status !== 'CANCELLED') {
                // Restore Stock
                for (const item of order.items) {
                    if (item.product.type === 'PRODUCT') {
                        const [updated] = await tx.update(products)
                            .set({ stock: sql`${products.stock} + ${Number(item.quantity)}` })
                            .where(eq(products.id, item.productId))
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

            // Note: If transitioning FROM Cancelled TO Confirmed/Draft, we would need to DEDUCT stock again.
            // For now, let's assume one-way flow or re-deduct if needed.
            // If user uncancels, we should check stock.
            if (order.status === 'CANCELLED' && newStatus === 'CONFIRMED') {
                // Check and Deduct Stock again
                for (const item of order.items) {
                    if (item.product.type === 'PRODUCT') {
                        const currentStock = Number(item.product.stock);
                        if (currentStock < Number(item.quantity)) {
                            throw new Error(`Stock insuficiente para reactivar orden: ${item.product.name}`);
                        }

                        const [updated] = await tx.update(products)
                            .set({ stock: sql`${products.stock} - ${Number(item.quantity)}` })
                            .where(eq(products.id, item.productId))
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
                            notes: "Order reactivated",
                            createdBy: user.id
                        });
                    }
                }
            }

            // 3. Update Status
            await tx.update(orders)
                .set({ status: newStatus })
                .where(eq(orders.id, orderId));
        });

        revalidatePath(`/dashboard/orders/${orderId}`);
        revalidatePath("/dashboard/orders");
        return { success: true };

    } catch (error: any) {
        console.error("Error updating order status:", error);
        return { error: error.message || "Error al actualizar estado" };
    }
}
