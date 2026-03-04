import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { memberships, orders, payrolls, treasuryTransactions, entities, employees } from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { startOfMonth, endOfMonth, parse } from "date-fns";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: organizationId } = await context.params;
        const searchParams = request.nextUrl.searchParams;
        const monthParam = searchParams.get('month'); // Expecting format 'yyyy-MM'

        if (!monthParam) {
            return new NextResponse("Missing month parameter", { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const membership = await db.query.memberships.findFirst({
            where: and(
                eq(memberships.userId, user.id),
                eq(memberships.organizationId, organizationId)
            ),
        });

        if (!membership || (membership.role !== 'ACCOUNTANT' && membership.role !== 'OWNER')) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const targetDate = parse(monthParam, 'yyyy-MM', new Date());
        const startDate = startOfMonth(targetDate);
        const endDate = endOfMonth(targetDate);

        // Fetch Orders
        const monthOrders = await db.select({
            date: orders.createdAt,
            type: orders.type,
            entityName: entities.commercialName,
            subtotal: orders.subtotalAmount,
            tax: orders.totalTaxAmount,
            retention: orders.totalRetentionAmount,
            total: orders.totalAmount,
        })
            .from(orders)
            .innerJoin(entities, eq(orders.entityId, entities.id))
            .where(
                and(
                    eq(orders.organizationId, organizationId),
                    eq(orders.status, 'CONFIRMED'),
                    sql`${orders.createdAt} >= ${startDate.toISOString()}`,
                    sql`${orders.createdAt} <= ${endDate.toISOString()}`
                )
            );

        // Fetch Payrolls
        const monthPayrolls = await db.select({
            date: payrolls.paymentDate,
            createdAt: payrolls.createdAt,
            employeeFirstName: employees.firstName,
            employeeLastName: employees.lastName,
            grossAmount: payrolls.grossAmount,
            deductions: payrolls.deductions,
            netAmount: payrolls.netAmount,
        })
            .from(payrolls)
            .innerJoin(employees, eq(payrolls.employeeId, employees.id))
            .where(
                and(
                    eq(payrolls.organizationId, organizationId),
                    eq(payrolls.status, 'PAID'),
                    sql`${payrolls.createdAt} >= ${startDate.toISOString()}`,
                    sql`${payrolls.createdAt} <= ${endDate.toISOString()}`
                )
            );

        // Fetch Treasury
        const monthTreasury = await db.select({
            date: treasuryTransactions.date,
            description: treasuryTransactions.description,
            amount: treasuryTransactions.amount,
        })
            .from(treasuryTransactions)
            .where(
                and(
                    eq(treasuryTransactions.organizationId, organizationId),
                    inArray(treasuryTransactions.category, ['OPERATING_EXPENSE', 'TAX']),
                    sql`${treasuryTransactions.date} >= ${startDate.toISOString()}`,
                    sql`${treasuryTransactions.date} <= ${endDate.toISOString()}`
                )
            );

        const rows: string[] = [];
        rows.push(["Fecha", "Tipo", "Concepto/Cliente/Proveedor", "Subtotal", "IVA", "Retenciones", "Total Neto"].join(","));

        const escapeCsv = (val: string | number | null | undefined) => {
            if (val === null || val === undefined) return '0';
            const str = String(val).replace(/"/g, '""');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str}"`;
            }
            return str;
        };

        const formatDate = (date: Date | null | undefined) => {
            if (!date) return "";
            return date.toISOString().split('T')[0]; // Simple YYYY-MM-DD
        };

        monthOrders.forEach(order => {
            const typ = order.type === 'SALE' ? 'Ingreso' : 'Egreso';
            rows.push([
                escapeCsv(formatDate(order.date)),
                escapeCsv(typ),
                escapeCsv(order.entityName),
                escapeCsv(order.subtotal),
                escapeCsv(order.tax),
                escapeCsv(order.retention),
                escapeCsv(order.total)
            ].join(","));
        });

        monthPayrolls.forEach(payroll => {
            const d = payroll.date || payroll.createdAt;
            rows.push([
                escapeCsv(formatDate(d)),
                escapeCsv('Nómina'),
                escapeCsv(`${payroll.employeeFirstName} ${payroll.employeeLastName}`),
                escapeCsv(payroll.grossAmount),
                escapeCsv('0'),
                escapeCsv(payroll.deductions),
                escapeCsv(payroll.netAmount)
            ].join(","));
        });

        monthTreasury.forEach(tx => {
            rows.push([
                escapeCsv(formatDate(tx.date)),
                escapeCsv('Egreso'),
                escapeCsv(tx.description),
                escapeCsv(tx.amount),
                escapeCsv('0'),
                escapeCsv('0'),
                escapeCsv(tx.amount)
            ].join(","));
        });

        const csvContent = "\uFEFF" + rows.join("\n");

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="exportacion_axioma_${monthParam}.csv"`,
            }
        });

    } catch (error) {
        console.error("Export error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
