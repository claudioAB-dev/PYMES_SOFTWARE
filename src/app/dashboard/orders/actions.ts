"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { orders, orderItems, memberships, products, entities } from "@/db/schema";
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
                    await tx.update(products)
                        .set({ stock: sql`${products.stock} - ${item.quantity}` })
                        .where(eq(products.id, item.productId));
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
                    await tx.update(products)
                        .set({ stock: sql`${products.stock} + ${Number(item.quantity)}` })
                        .where(eq(products.id, item.productId));
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
