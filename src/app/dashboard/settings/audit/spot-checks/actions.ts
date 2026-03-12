"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { treasuryTransactions, memberships } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

async function checkOwnerRole() {
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

    // Spot Checks are critical, ideally only OWNER or ADMIN.
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
        return { error: "Solo los administradores pueden realizar auditorías físicas.", allowed: false };
    }

    return { allowed: true, organizationId: membership.organizationId, user };
}

export type SpotCheckItem = {
    id: string;
    description: string;
    amount: string;
    date: Date;
    category: string;
};

export async function generateRandomAuditPlan(limit: number = 5): Promise<{ error?: string; items?: SpotCheckItem[] }> {
    const auth = await checkOwnerRole();
    if (!auth.allowed) return { error: auth.error };

    const organizationId = auth.organizationId!;

    try {
        // Fetch random expenses from the treasury ledger
        // ORDER BY RANDOM() limit X
        const randomExpenses = await db.select({
            id: treasuryTransactions.id,
            description: treasuryTransactions.description,
            amount: treasuryTransactions.amount,
            date: treasuryTransactions.date,
            category: treasuryTransactions.category,
        })
        .from(treasuryTransactions)
        .where(
            and(
                eq(treasuryTransactions.organizationId, organizationId),
                eq(treasuryTransactions.type, 'EXPENSE')
            )
        )
        .orderBy(sql`RANDOM()`)
        .limit(limit);

        return { items: randomExpenses };

    } catch (error: any) {
        console.error("Error generating audit plan:", error);
        return { error: "Ocurrió un error al generar el plan de auditoría." };
    }
}
