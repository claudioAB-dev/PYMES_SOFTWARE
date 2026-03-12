"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { orders, memberships, entities, payments, financialAccounts, treasuryTransactions } from "@/db/schema";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logAuditTransaction } from "@/lib/audit/logger";

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

export async function createFastPurchase(input: import("@/lib/validators/fast-purchases").CreateFastPurchaseInput) {
    const auth = await checkRbacAuth();
    if (!auth.allowed) return { error: auth.error };

    const { createFastPurchaseSchema } = await import("@/lib/validators/fast-purchases");
    const validatedFields = createFastPurchaseSchema.safeParse(input);

    if (!validatedFields.success) {
        return { error: "Datos inválidos: " + validatedFields.error.message };
    }

    const { concept, amount, date, entityId, accountId, requiresCfdi } = validatedFields.data;
    const organizationId = auth.organizationId!;

    try {
        const newOrderId = await db.transaction(async (tx) => {
            // Verify Account
            const account = await tx.query.financialAccounts.findFirst({
                where: and(
                    eq(financialAccounts.id, accountId),
                    eq(financialAccounts.organizationId, organizationId)
                )
            });

            if (!account) throw new Error("Cuenta origen no encontrada");

            // 1. Create Purchase Order Header
            const invoiceStatus = requiresCfdi ? 'pending' : 'not_required';
            const taxRate = requiresCfdi ? 0.16 : 0;
            const subtotal = amount / (1 + taxRate);
            const totalTaxAmount = amount - subtotal;

            const [newOrder] = await tx.insert(orders).values({
                organizationId,
                entityId: entityId === 'none' ? null : (entityId || null),
                type: 'PURCHASE',
                concept,
                status: 'CONFIRMED',
                paymentStatus: 'PAID',
                requiresCfdi,
                invoiceStatus,
                subtotalAmount: subtotal.toFixed(2),
                totalTaxAmount: totalTaxAmount.toFixed(2),
                totalRetentionAmount: '0.00',
                totalAmount: amount.toFixed(2),
                expectedDeliveryDate: date,
                createdAt: date,
            }).returning({ id: orders.id });

            // 2. Register Payment
            await tx.insert(payments).values({
                organizationId,
                orderId: newOrder.id,
                amount: amount.toString(),
                method: 'OTHER',
                date: date,
            });

            // 3. Update Treasury
            await tx.insert(treasuryTransactions).values({
                organizationId,
                accountId,
                type: 'EXPENSE',
                category: 'OPERATING_EXPENSE',
                amount: amount.toString(),
                referenceId: newOrder.id,
                description: `Compra rápida: ${concept}`,
                date: date,
                createdBy: auth.user!.id,
            });

            await tx.update(financialAccounts)
                .set({ balance: sql`${financialAccounts.balance} - ${amount}` })
                .where(and(eq(financialAccounts.id, accountId), eq(financialAccounts.organizationId, organizationId)));
            
            return newOrder.id;
        });

        // Inject Audit Log
        const serializedInput = {
            ...input,
            date: input.date.toISOString(),
        };

        await logAuditTransaction({
            organizationId: organizationId,
            userId: auth.user!.id,
            action: 'CREATE',
            entityType: 'quick_expense',
            entityId: newOrderId,
            newValues: serializedInput,
        });

        revalidatePath("/dashboard/quick-expenses");
        return { success: true };

    } catch (error: any) {
        console.error("Error creating fast purchase:", error);
        return { error: error.message || "Error al registrar la compra rápida." };
    }
}
