"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { orders, payments, memberships, orderItems, products, entities } from "@/db/schema";
import { eq, and, gte, lte, desc, sql, sum, count } from "drizzle-orm";
import { startOfMonth, endOfMonth, subDays, format } from "date-fns";
import { es } from "date-fns/locale";

// Helper to get current organization
async function getOrganizationId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) return null;
    return userMemberships[0].organizationId;
}

export async function getDashboardMetrics() {
    const organizationId = await getOrganizationId();
    if (!organizationId) return null;

    const now = new Date();
    const firstDay = startOfMonth(now);
    const lastDay = endOfMonth(now);

    // 1. Sales (Total Order Amount) - Current Month
    const [salesResult] = await db.select({ value: sum(orders.totalAmount) })
        .from(orders)
        .where(and(
            eq(orders.organizationId, organizationId),
            gte(orders.createdAt, firstDay),
            lte(orders.createdAt, lastDay),
            eq(orders.status, 'CONFIRMED') // Only confirmed orders count as sales usually, or maybe all not cancelled? Let's stick to Confirmed + Paid/Partial? Or just not Cancelled?
            // "Contexto: El ERP ya gestiona ventas...". Usually Sales = Confirmed Orders.
            // Let's count everything that is NOT Cancelled.
        ));

    // Actually, SQL sum returns string for decimals usually.
    const sales = Number(salesResult?.value || 0);

    // 2. Revenue (Total Payments Received) - Current Month
    const [revenueResult] = await db.select({ value: sum(payments.amount) })
        .from(payments)
        .where(and(
            eq(payments.organizationId, organizationId),
            gte(payments.date, firstDay),
            lte(payments.date, lastDay)
        ));
    const revenue = Number(revenueResult?.value || 0);

    // 3. Accounts Receivable (Total Pending Balance) - All Time
    // Pending = Total Amount - Total Paid for all orders that are not fully paid
    // This is complex directly in SQL with the current schema if we don't store "pending_amount".
    // We can sum (total_amount) from orders where payment_status != PAID and status != CANCELLED
    // MINUS sum(amount) from payments linked to those orders.
    // Simpler approach: Sum of all orders (not cancelled) - Sum of all payments.

    const [totalOrdersAmount] = await db.select({ value: sum(orders.totalAmount) })
        .from(orders)
        .where(and(
            eq(orders.organizationId, organizationId),
            sql`${orders.status} != 'CANCELLED'`
        ));

    const [totalPaymentsAmount] = await db.select({ value: sum(payments.amount) })
        .from(payments)
        .where(eq(payments.organizationId, organizationId));

    const receivables = Number(totalOrdersAmount?.value || 0) - Number(totalPaymentsAmount?.value || 0);

    // 4. Total Orders (Count) - Current Month
    const [ordersCountResult] = await db.select({ value: count(orders.id) })
        .from(orders)
        .where(and(
            eq(orders.organizationId, organizationId),
            gte(orders.createdAt, firstDay),
            lte(orders.createdAt, lastDay),
            sql`${orders.status} != 'CANCELLED'`
        ));
    const ordersCount = Number(ordersCountResult?.value || 0);

    return {
        sales,
        revenue,
        receivables,
        ordersCount
    };
}

export async function getRecentSales() {
    const organizationId = await getOrganizationId();
    if (!organizationId) return [];

    const recentOrders = await db.query.orders.findMany({
        where: and(
            eq(orders.organizationId, organizationId),
            sql`${orders.status} != 'CANCELLED'` // Show generic recent activity or just valid sales? User said "Ventas Recientes", usually implies valid ones.
        ),
        orderBy: [desc(orders.createdAt)],
        limit: 5,
        with: {
            entity: true,
        }
    });

    return recentOrders;
}

export async function getSalesChartData() {
    const organizationId = await getOrganizationId();
    if (!organizationId) return [];

    const now = new Date();
    const days30Ago = subDays(now, 30);

    // Fetch all orders in last 30 days
    const ordersData = await db.query.orders.findMany({
        where: and(
            eq(orders.organizationId, organizationId),
            gte(orders.createdAt, days30Ago),
            sql`${orders.status} != 'CANCELLED'`
        ),
        columns: {
            createdAt: true,
            totalAmount: true,
        }
    });

    // Group by day in JS
    const groupedData = new Map<string, number>();

    // Initialize all days with 0
    for (let i = 0; i <= 30; i++) {
        const date = subDays(now, 30 - i);
        const key = format(date, 'yyyy-MM-dd');
        groupedData.set(key, 0);
    }

    // Sum details
    ordersData.forEach(order => {
        const key = format(new Date(order.createdAt), 'yyyy-MM-dd');
        if (groupedData.has(key)) {
            groupedData.set(key, (groupedData.get(key) || 0) + Number(order.totalAmount));
        }
    });

    // Convert to array
    const chartData = Array.from(groupedData.entries()).map(([date, value]) => ({
        date,
        shortDate: format(new Date(date), 'dd/MM'),
        value
    }));

    return chartData;
}
