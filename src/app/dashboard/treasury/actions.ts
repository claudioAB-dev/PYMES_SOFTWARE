"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { financialAccounts, memberships, treasuryTransactions, orders, payments } from "@/db/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getFinancialAccounts() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) return [];
    const organizationId = userMemberships[0].organizationId;

    return await db.query.financialAccounts.findMany({
        where: eq(financialAccounts.organizationId, organizationId),
        orderBy: [desc(financialAccounts.createdAt)],
    });
}

export async function getTotalBalance() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 0;

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) return 0;
    const organizationId = userMemberships[0].organizationId;

    const accounts = await db.query.financialAccounts.findMany({
        where: eq(financialAccounts.organizationId, organizationId),
    });

    return accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
}

export async function registerManualTransaction(input: {
    accountId: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    category: 'SALE' | 'PURCHASE' | 'PAYROLL' | 'OPERATING_EXPENSE' | 'TAX' | 'CAPITAL';
    amount: number;
    description: string;
}) {
    const { accountId, type, category, amount, description } = input;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autorizado" };

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) return { error: "No organization found" };
    const organizationId = userMemberships[0].organizationId;

    try {
        await db.transaction(async (tx) => {
            const account = await tx.query.financialAccounts.findFirst({
                where: and(
                    eq(financialAccounts.id, accountId),
                    eq(financialAccounts.organizationId, organizationId)
                )
            });

            if (!account) throw new Error("Cuenta financiera no encontrada");

            if (amount <= 0) {
                throw new Error("El monto debe ser mayor a 0");
            }

            // Insert Treasury Transaction
            await tx.insert(treasuryTransactions).values({
                organizationId,
                accountId,
                type,
                category,
                amount: amount.toString(),
                description,
                createdBy: user.id,
            });

            // Update Account Balance
            // If INCOME (+), EXPENSE (-)
            const balanceAdjustment = type === 'INCOME' ? amount : -amount;

            await tx.update(financialAccounts)
                .set({ balance: sql`${financialAccounts.balance} + ${balanceAdjustment}` })
                .where(and(eq(financialAccounts.id, accountId), eq(financialAccounts.organizationId, organizationId)));
        });

        revalidatePath("/dashboard/treasury");
        return { success: true };
    } catch (error: any) {
        console.error("Error registering manual transaction:", error);
        return { error: error.message || "Error al registrar transacción" };
    }
}

export async function getCashFlowSummary(startDate: Date, endDate: Date) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) return null;
    const organizationId = userMemberships[0].organizationId;

    // To prevent Drizzle issue with comparing dates without stringification in some cases, we use a raw SQL for date range if needed,
    // or we can just pull all and filter if it's not huge. Drizzle can handle it with gte and lte usually.
    const transactions = await db.query.treasuryTransactions.findMany({
        where: and(
            eq(treasuryTransactions.organizationId, organizationId),
            gte(treasuryTransactions.date, startDate),
            lte(treasuryTransactions.date, endDate)
        ),
        orderBy: [desc(treasuryTransactions.date)],
        with: {
            account: true,
        }
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown: Record<string, number> = {};

    transactions.forEach(t => {
        const amt = Number(t.amount);
        if (t.type === 'INCOME') {
            totalIncome += amt;
        } else if (t.type === 'EXPENSE') {
            totalExpense += amt;
        }

        if (!categoryBreakdown[t.category]) {
            categoryBreakdown[t.category] = 0;
        }
        categoryBreakdown[t.category] += (t.type === 'EXPENSE' ? -amt : amt);
    });

    return {
        totalIncome,
        totalExpense,
        netCashFlow: totalIncome - totalExpense,
        categoryBreakdown,
        transactions
    };
}

export async function createFinancialAccount(input: {
    name: string;
    type: 'BANK' | 'CASH' | 'CREDIT';
    currency: string;
    initialBalance: number;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autorizado" };

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) return { error: "No organization found" };
    const { organizationId, role } = userMemberships[0];

    if (!['OWNER', 'ADMIN', 'ACCOUNTANT'].includes(role)) {
        return { error: "No tienes permisos para crear cuentas" };
    }

    try {
        await db.transaction(async (tx) => {
            const [newAccount] = await tx.insert(financialAccounts).values({
                organizationId,
                name: input.name,
                type: input.type,
                currency: input.currency,
                balance: input.initialBalance.toString(),
                isActive: true,
            }).returning({ id: financialAccounts.id });

            if (input.initialBalance > 0) {
                await tx.insert(treasuryTransactions).values({
                    organizationId,
                    accountId: newAccount.id,
                    type: 'INCOME',
                    category: 'CAPITAL',
                    amount: input.initialBalance.toString(),
                    description: 'Saldo inicial',
                    createdBy: user.id,
                });
            } else if (input.initialBalance < 0) {
                await tx.insert(treasuryTransactions).values({
                    organizationId,
                    accountId: newAccount.id,
                    type: 'EXPENSE',
                    category: 'CAPITAL', // Using CAPITAL for initial balance
                    amount: Math.abs(input.initialBalance).toString(),
                    description: 'Saldo inicial (Negativo)',
                    createdBy: user.id,
                });
            }
        });

        revalidatePath("/dashboard/treasury");
        return { success: true };
    } catch (error: any) {
        console.error("Error creating financial account:", error);
        return { error: "Error al crear la cuenta financiera" };
    }
}

export async function updateFinancialAccount(
    accountId: string,
    input: {
        name?: string;
        isActive?: boolean;
    }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autorizado" };

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) return { error: "No organization found" };
    const { organizationId, role } = userMemberships[0];

    if (!['OWNER', 'ADMIN', 'ACCOUNTANT'].includes(role)) {
        return { error: "No tienes permisos para modificar cuentas" };
    }

    // Prepare update data
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    updateData.updatedAt = new Date();

    if (Object.keys(updateData).length === 1) return { success: true }; // Only updatedAt

    try {
        await db.update(financialAccounts)
            .set(updateData)
            .where(
                and(
                    eq(financialAccounts.id, accountId),
                    eq(financialAccounts.organizationId, organizationId)
                )
            );

        revalidatePath("/dashboard/treasury");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating financial account:", error);
        return { error: "Error al actualizar la cuenta financiera" };
    }
}

export async function registerOrderPayment(orderId: string, amount: number, method: 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER', accountId: string, reference?: string) {
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
            const transactionType = order.type === 'SALE' ? 'INCOME' : 'EXPENSE';
            const transactionCategory = order.type === 'SALE' ? 'SALE' : 'PURCHASE';

            await tx.insert(treasuryTransactions).values({
                organizationId,
                accountId,
                type: transactionType,
                category: transactionCategory,
                amount: amount.toString(),
                referenceId: orderId,
                description: reference ? `Pago ${transactionCategory.toLowerCase()}: ${reference}` : `Pago ${transactionCategory.toLowerCase()}: ${orderId.substring(0, 8)}`,
                createdBy: user.id,
            });

            const balanceAdjustment = transactionType === 'INCOME' ? amount : -amount;

            await tx.update(financialAccounts)
                .set({ balance: sql`${financialAccounts.balance} + ${balanceAdjustment}` })
                .where(and(eq(financialAccounts.id, accountId), eq(financialAccounts.organizationId, organizationId)));

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
                .where(and(eq(orders.id, orderId), eq(orders.organizationId, organizationId)));
        });

        revalidatePath(`/dashboard/orders/${orderId}`);
        revalidatePath("/dashboard/orders");
        // Also revalidate purchases if they use the same action and different path in the future, 
        // For now, this is enough since purchases might be at /dashboard/purchases/[id]
        if (orderId) {
            revalidatePath(`/dashboard/purchases/${orderId}`);
            revalidatePath("/dashboard/purchases");
        }
        revalidatePath("/dashboard/treasury");

        return { success: true };

    } catch (error: any) {
        console.error("Error registering order payment:", error);
        return { error: error.message || "Error al registrar pago" };
    }
}

