"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { financialAccounts, memberships, treasuryTransactions } from "@/db/schema";
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
                .where(eq(financialAccounts.id, accountId));
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
