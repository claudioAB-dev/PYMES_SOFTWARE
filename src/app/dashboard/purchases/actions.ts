"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { orders, orderItems, memberships, products, entities, payments, inventoryMovements, financialAccounts, treasuryTransactions, payables } from "@/db/schema";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { createPurchaseOrderSchema, CreatePurchaseOrderInput } from "@/lib/validators/purchases";
import { revalidatePath } from "next/cache";

// Helper to check RBAC with Drizzle
async function checkRbacAuth() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autorizado", allowed: false };
    }

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) {
        return { error: "No se encontró organización activa", allowed: false };
    }

    const membership = userMemberships[0];
    const allowedRoles = ["OWNER", "ADMIN", "ACCOUNTANT"];

    if (!allowedRoles.includes(membership.role)) {
        return { error: "No tienes permisos suficientes (Requerido: OWNER, ADMIN o ACCOUNTANT)", allowed: false };
    }

    return { allowed: true, organizationId: membership.organizationId, user };
}

// --- Data Fetching ---

export async function getSuppliers() {
    const auth = await checkRbacAuth();
    if (!auth.allowed) return [];

    return await db.query.entities.findMany({
        where: and(
            eq(entities.organizationId, auth.organizationId!),
            inArray(entities.type, ['SUPPLIER', 'BOTH'])
        ),
        orderBy: [desc(entities.createdAt)],
    });
}

export async function getFinancialAccounts() {
    const auth = await checkRbacAuth();
    if (!auth.allowed) return [];

    return await db.query.financialAccounts.findMany({
        where: eq(financialAccounts.organizationId, auth.organizationId!),
        columns: {
            id: true,
            name: true,
        },
        orderBy: [desc(financialAccounts.createdAt)],
    });
}

// --- Mutations ---

export async function createPurchaseOrder(input: CreatePurchaseOrderInput) {
    const auth = await checkRbacAuth();
    if (!auth.allowed) return { error: auth.error };

    const validatedFields = createPurchaseOrderSchema.safeParse(input);

    if (!validatedFields.success) {
        return { error: "Datos inválidos: " + validatedFields.error.message };
    }

    const { entityId, status, items, requiresCfdi = true } = validatedFields.data;
    const organizationId = auth.organizationId!;

    // Validate Products Exist
    const productIds = items.map(i => i.productId);
    const dbProducts = await db.query.products.findMany({
        where: and(
            inArray(products.id, productIds),
            eq(products.organizationId, organizationId)
        ),
    });

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
            return { error: `Producto no encontrado: ${item.productId}` };
        }
    }

    try {
        await db.transaction(async (tx) => {
            // Calculate totals
            let subtotal = 0;
            for (const item of items) {
                subtotal += item.quantity * item.price;
            }

            const taxRate = requiresCfdi ? 0.16 : 0;
            const totalTaxAmount = subtotal * taxRate;
            const totalAmount = subtotal + totalTaxAmount;
            
            const invoiceStatus = requiresCfdi ? 'pending' : 'not_required';

            // 1. Create Purchase Order Header
            const [newOrder] = await tx.insert(orders).values({
                organizationId,
                entityId,
                status,
                type: 'PURCHASE',
                requiresCfdi,
                invoiceStatus,
                subtotalAmount: subtotal.toFixed(2),
                totalTaxAmount: totalTaxAmount.toFixed(2),
                totalRetentionAmount: '0.00',
                totalAmount: totalAmount.toFixed(2),
                expectedDeliveryDate: validatedFields.data.expectedDeliveryDate,
            }).returning({ id: orders.id });

            // 2. Insert Order Items & Totals & Add Stock
            for (const item of items) {
                const itemTotal = item.quantity * item.price;
                const itemTax = itemTotal * taxRate;

                await tx.insert(orderItems).values({
                    orderId: newOrder.id,
                    productId: item.productId,
                    quantity: item.quantity.toString(),
                    unitPrice: item.price.toString(),
                    taxAmount: itemTax.toFixed(2),
                    retentionAmount: '0.00'
                });

                if (status === 'CONFIRMED') {
                    const product = productMap.get(item.productId);
                    if (product && product.type === 'PRODUCT') {
                        const [updated] = await tx.update(products)
                            .set({
                                stock: sql`${products.stock} + ${item.quantity}`,
                                cost: item.price.toString()
                            })
                            .where(and(eq(products.id, item.productId), eq(products.organizationId, organizationId)))
                            .returning({ stock: products.stock });

                        const newStock = Number(updated.stock);
                        const previousStock = newStock - Number(item.quantity);

                        await tx.insert(inventoryMovements).values({
                            organizationId,
                            productId: item.productId,
                            type: 'IN_PURCHASE',
                            quantity: item.quantity.toString(),
                            previousStock: previousStock.toString(),
                            newStock: newStock.toString(),
                            referenceId: newOrder.id,
                            createdBy: auth.user!.id
                        });
                    }
                }
            }

            // Generar Cuenta por Pagar (Payable) si se crea como CONFIRMED
            if (status === 'CONFIRMED' && entityId) {
                const entityData = await tx.query.entities.findFirst({
                    where: and(eq(entities.id, entityId), eq(entities.organizationId, organizationId))
                });

                const creditDays = entityData?.creditDays || 0;
                const finalCreditDays = creditDays > 0 ? creditDays : 30;

                const issueDate = new Date();
                const dueDate = new Date();
                dueDate.setDate(issueDate.getDate() + finalCreditDays);

                await tx.insert(payables).values({
                    organizationId,
                    entityId,
                    orderId: newOrder.id,
                    amount: totalAmount.toFixed(2),
                    balance: totalAmount.toFixed(2),
                    status: 'UNPAID',
                    issueDate,
                    dueDate
                });
            }
        });

        revalidatePath("/dashboard/purchases");
        return { success: true };

    } catch (error: any) {
        console.error("Error creating purchase order:", error);
        return { error: error.message || "Error al crear la orden de compra. Por favor intente de nuevo." };
    }
}



export async function registerSupplierPayment(orderId: string, amount: number, method: 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER', accountId: string, reference?: string) {
    const auth = await checkRbacAuth();
    if (!auth.allowed) return { error: auth.error };
    const organizationId = auth.organizationId!;

    try {
        await db.transaction(async (tx) => {
            const order = await tx.query.orders.findFirst({
                where: and(
                    eq(orders.id, orderId),
                    eq(orders.organizationId, organizationId),
                    eq(orders.type, 'PURCHASE') // Security check
                ),
                with: {
                    payments: true,
                }
            });

            if (!order) throw new Error("Orden de compra no encontrada");

            const totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
            const pendingBalance = Number(order.totalAmount) - totalPaid;

            if (amount > pendingBalance) {
                throw new Error(`El monto excede el saldo pendiente. Saldo: ${pendingBalance.toFixed(2)}`);
            }

            if (amount <= 0) {
                throw new Error("El monto debe ser mayor a 0");
            }

            // Verify Account
            const account = await tx.query.financialAccounts.findFirst({
                where: and(
                    eq(financialAccounts.id, accountId),
                    eq(financialAccounts.organizationId, organizationId)
                )
            });

            if (!account) throw new Error("Cuenta financiera no encontrada");

            // Register Payment
            await tx.insert(payments).values({
                organizationId,
                orderId,
                amount: amount.toString(),
                method,
                reference,
            });

            // Update Treasury
            await tx.insert(treasuryTransactions).values({
                organizationId,
                accountId,
                type: 'EXPENSE',
                category: 'PURCHASE',
                amount: amount.toString(),
                referenceId: orderId,
                description: reference ? `Pago compra: ${reference}` : `Pago compra: ${orderId.substring(0, 8)}`,
                createdBy: auth.user!.id,
            });

            await tx.update(financialAccounts)
                .set({ balance: sql`${financialAccounts.balance} - ${amount}` })
                .where(and(eq(financialAccounts.id, accountId), eq(financialAccounts.organizationId, organizationId)));

            const newTotalPaid = totalPaid + amount;
            const orderTotal = Number(order.totalAmount);

            let newStatus: 'UNPAID' | 'PARTIAL' | 'PAID' = 'PARTIAL';
            if (newTotalPaid >= orderTotal - 0.01) {
                newStatus = 'PAID';
            } else if (newTotalPaid > 0) {
                newStatus = 'PARTIAL';
            } else {
                newStatus = 'UNPAID';
            }

            await tx.update(orders)
                .set({ paymentStatus: newStatus })
                .where(and(eq(orders.id, orderId), eq(orders.organizationId, organizationId)));
        });

        revalidatePath(`/dashboard/purchases/${orderId}`);
        revalidatePath("/dashboard/purchases");
        return { success: true };

    } catch (error: any) {
        console.error("Error registering supplier payment:", error);
        return { error: error.message || "Error al registrar pago a proveedor" };
    }
}

export async function updatePurchaseOrderStatus(orderId: string, newStatus: 'CONFIRMED' | 'CANCELLED') {
    const auth = await checkRbacAuth();
    if (!auth.allowed) return { error: auth.error };
    const organizationId = auth.organizationId!;

    try {
        await db.transaction(async (tx) => {
            const order = await tx.query.orders.findFirst({
                where: and(
                    eq(orders.id, orderId),
                    eq(orders.organizationId, organizationId),
                    eq(orders.type, 'PURCHASE')
                ),
                with: {
                    items: {
                        with: { product: true }
                    }
                }
            });

            if (!order) throw new Error("Orden de compra no encontrada");

            // --- Inventory Logic ---
            // Si la orden de compra pasa a CANCELLED, debemos RESTAR inventario (revirtiendo entrada)
            if (newStatus === 'CANCELLED' && order.status !== 'CANCELLED') {
                for (const item of order.items) {
                    if (item.product.type === 'PRODUCT') {
                        // Validate we have enough stock to cancel (avoid negative stock if it was sold)
                        const currentStock = Number(item.product.stock);
                        if (currentStock < Number(item.quantity)) {
                            throw new Error(`No se puede cancelar: el stock de ${item.product.name} quedaría negativo.`);
                        }

                        const [updated] = await tx.update(products)
                            .set({ stock: sql`${products.stock} - ${Number(item.quantity)}` }) // REVERSING the ADD -> SUBTRACT
                            .where(and(eq(products.id, item.productId), eq(products.organizationId, organizationId)))
                            .returning({ stock: products.stock });

                        const newStock = Number(updated.stock);
                        const previousStock = newStock + Number(item.quantity);

                        await tx.insert(inventoryMovements).values({
                            organizationId,
                            productId: item.productId,
                            type: 'OUT_RETURN',
                            quantity: item.quantity.toString(),
                            previousStock: previousStock.toString(),
                            newStock: newStock.toString(),
                            referenceId: orderId,
                            notes: "Purchase cancelled",
                            createdBy: auth.user!.id
                        });
                    }
                }
            }

            // Si pasa de CANCELLED a CONFIRMED, SUMAMOS inventario (re-ingresando)
            if (order.status === 'CANCELLED' && newStatus === 'CONFIRMED') {
                for (const item of order.items) {
                    if (item.product.type === 'PRODUCT') {
                        const [updated] = await tx.update(products)
                            .set({ stock: sql`${products.stock} + ${Number(item.quantity)}` }) // RE-ADDING
                            .where(and(eq(products.id, item.productId), eq(products.organizationId, organizationId)))
                            .returning({ stock: products.stock });

                        const newStock = Number(updated.stock);
                        const previousStock = newStock - Number(item.quantity);

                        await tx.insert(inventoryMovements).values({
                            organizationId,
                            productId: item.productId,
                            type: 'IN_PURCHASE',
                            quantity: item.quantity.toString(),
                            previousStock: previousStock.toString(),
                            newStock: newStock.toString(),
                            referenceId: orderId,
                            notes: "Purchase reactivated",
                            createdBy: auth.user!.id
                        });
                    }
                }

                // Generar Cuenta por Pagar (Payable) si no existe
                if (order.entityId) {
                    const existingPayable = await tx.query.payables.findFirst({
                        where: and(eq(payables.orderId, orderId), eq(payables.organizationId, organizationId))
                    });

                    if (!existingPayable) {
                        const entityData = await tx.query.entities.findFirst({
                            where: and(eq(entities.id, order.entityId), eq(entities.organizationId, organizationId))
                        });

                        const creditDays = entityData?.creditDays || 0;
                        const finalCreditDays = creditDays > 0 ? creditDays : 30;

                        const issueDate = new Date();
                        const dueDate = new Date();
                        dueDate.setDate(issueDate.getDate() + finalCreditDays);

                        await tx.insert(payables).values({
                            organizationId,
                            entityId: order.entityId,
                            orderId: order.id,
                            amount: order.totalAmount || "0",
                            balance: order.totalAmount || "0",
                            status: 'UNPAID',
                            issueDate,
                            dueDate
                        });
                    }
                }
            }

            // Si estaba DRAFT y pasa a CONFIRMED (caso común si no se generó automático en create)
            // Ya sumamos inventario en createPurchaseOrder, así que no lo duplicamos aquí,
            // pero sí generamos la cuenta por pagar si falta.
            if (order.status === 'DRAFT' && newStatus === 'CONFIRMED') {
                if (order.entityId) {
                    const existingPayable = await tx.query.payables.findFirst({
                        where: and(eq(payables.orderId, orderId), eq(payables.organizationId, organizationId))
                    });

                    if (!existingPayable) {
                        const entityData = await tx.query.entities.findFirst({
                            where: and(eq(entities.id, order.entityId), eq(entities.organizationId, organizationId))
                        });

                        const creditDays = entityData?.creditDays || 0;
                        const finalCreditDays = creditDays > 0 ? creditDays : 30;

                        const issueDate = new Date();
                        const dueDate = new Date();
                        dueDate.setDate(issueDate.getDate() + finalCreditDays);

                        await tx.insert(payables).values({
                            organizationId,
                            entityId: order.entityId,
                            orderId: order.id,
                            amount: order.totalAmount || "0",
                            balance: order.totalAmount || "0",
                            status: 'UNPAID',
                            issueDate,
                            dueDate
                        });
                    }
                }
            }

            await tx.update(orders)
                .set({ status: newStatus })
                .where(and(eq(orders.id, orderId), eq(orders.organizationId, organizationId)));
        });

        revalidatePath(`/dashboard/purchases/${orderId}`);
        revalidatePath("/dashboard/purchases");
        return { success: true };

    } catch (error: any) {
        console.error("Error updating purchase order status:", error);
        return { error: error.message || "Error al actualizar estado" };
    }
}
