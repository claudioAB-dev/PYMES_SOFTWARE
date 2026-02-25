"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { orders, entities, payments, memberships } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";

export type AgingReportItem = {
    entityId: string;
    entityName: string;
    creditLimit: number;
    creditDays: number;
    totalPending: number;
    current: number;
    days1to30: number;
    days31to60: number;
    daysOver60: number;
};

export async function getReceivablesAging(): Promise<AgingReportItem[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) return [];
    const organizationId = userMemberships[0].organizationId;

    // Fetch unpaid/partial sales orders
    const unpaidOrders = await db.query.orders.findMany({
        where: and(
            eq(orders.organizationId, organizationId),
            eq(orders.type, 'SALE'),
            inArray(orders.paymentStatus, ['UNPAID', 'PARTIAL']),
            inArray(orders.status, ['DRAFT', 'CONFIRMED'])
        ),
        with: {
            entity: true,
            payments: true
        }
    });

    const agingMap = new Map<string, AgingReportItem>();
    const now = new Date();

    for (const order of unpaidOrders) {
        if (!order.entity) continue;
        const e = order.entity;

        const orderTotal = Number(order.totalAmount);
        const paidAmount = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const pendingBalance = orderTotal - paidAmount;

        if (pendingBalance <= 0) continue;

        if (!agingMap.has(e.id)) {
            agingMap.set(e.id, {
                entityId: e.id,
                entityName: e.commercialName || e.legalName || "Unknown",
                creditLimit: Number(e.creditLimit) || 0,
                creditDays: e.creditDays || 0,
                totalPending: 0,
                current: 0,
                days1to30: 0,
                days31to60: 0,
                daysOver60: 0
            });
        }

        const report = agingMap.get(e.id)!;
        report.totalPending += pendingBalance;

        // Calculate days overdue
        const createdAt = new Date(order.createdAt);
        const daysPassed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const creditDays = e.creditDays || 0;

        if (daysPassed <= creditDays) {
            report.current += pendingBalance;
        } else {
            const overdueDays = daysPassed - creditDays;
            if (overdueDays <= 30) {
                report.days1to30 += pendingBalance;
            } else if (overdueDays <= 60) {
                report.days31to60 += pendingBalance;
            } else {
                report.daysOver60 += pendingBalance;
            }
        }
    }

    return Array.from(agingMap.values()).sort((a, b) => b.totalPending - a.totalPending);
}
