import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { memberships, orders, organizations } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { PrintButton } from "./print-button";
import { TrendingUp, TrendingDown, Calculator, Building } from "lucide-react";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AccountantClientDetailsPage({ params }: PageProps) {
    const { id: organizationId } = await params;

    // 1. Authentication & Security
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Check membership
    const membership = await db.query.memberships.findFirst({
        where: and(
            eq(memberships.userId, user.id),
            eq(memberships.organizationId, organizationId),
            eq(memberships.role, 'ACCOUNTANT')
        ),
    });

    if (!membership) {
        redirect("/accountant"); // Unauthorized, redirect back to the accountant dashboard
    }

    // Fetch Organization data
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId)
    });

    if (!org) {
        return notFound();
    }

    // 2. Data Calculation
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const monthName = format(now, "MMMM yyyy", { locale: es });
    const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    // Fetch Orders for the current month
    const monthOrders = await db.select({
        type: orders.type,
        subtotalAmount: sql<number>`sum(${orders.subtotalAmount})`,
        totalTaxAmount: sql<number>`sum(${orders.totalTaxAmount})`,
        totalRetentionAmount: sql<number>`sum(${orders.totalRetentionAmount})`,
    })
        .from(orders)
        .where(
            and(
                eq(orders.organizationId, organizationId),
                eq(orders.status, 'CONFIRMED'),
                sql`${orders.createdAt} >= ${currentMonthStart.toISOString()}`,
                sql`${orders.createdAt} <= ${currentMonthEnd.toISOString()}`
            )
        )
        .groupBy(orders.type);

    let income = {
        subtotal: 0,
        iva: 0,
        retention: 0,
        net: 0
    };

    let expenses = {
        subtotal: 0,
        iva: 0,
        total: 0
    };

    monthOrders.forEach(row => {
        if (row.type === 'SALE') {
            income.subtotal = Number(row.subtotalAmount || 0);
            income.iva = Number(row.totalTaxAmount || 0);
            income.retention = Number(row.totalRetentionAmount || 0);
            income.net = income.subtotal + income.iva - income.retention;
        } else if (row.type === 'PURCHASE') {
            expenses.subtotal = Number(row.subtotalAmount || 0);
            expenses.iva = Number(row.totalTaxAmount || 0);
            expenses.total = expenses.subtotal + expenses.iva;
        }
    });

    const ivaDifference = income.iva - expenses.iva;
    const isIvaInFavor = ivaDifference < 0;

    // 3. UI Implementation
    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-12 print:bg-white print:text-black" suppressHydrationWarning>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Building className="w-8 h-8 text-indigo-600 print:text-black" />
                        Resumen Fiscal - {org.name}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Mes evaluado: <strong className="text-slate-700" suppressHydrationWarning>{capitalizedMonthName}</strong>
                    </p>
                </div>
                <div className="print:hidden">
                    <PrintButton />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ingresos Card */}
                <Card className="border-t-4 border-t-emerald-500 shadow-sm">
                    <CardHeader className="pb-4 border-b">
                        <CardTitle className="flex items-center gap-2 text-emerald-700 font-bold text-xl">
                            <TrendingUp className="w-6 h-6" />
                            Ingresos (RESICO)
                        </CardTitle>
                        <CardDescription>
                            Ventas confirmadas en el mes seleccionado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between items-center text-slate-600">
                            <span>Subtotal Facturado (Base ISR)</span>
                            <span className="font-medium text-slate-900">{formatCurrency(income.subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                            <span>+ IVA Trasladado (16%)</span>
                            <span className="font-medium text-emerald-600">{formatCurrency(income.iva)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600 border-b pb-4">
                            <span>- Retención ISR (1.25%)</span>
                            <span className="font-medium text-rose-600">{formatCurrency(income.retention)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="font-bold text-lg text-slate-800">= Total Neto Percibido</span>
                            <span className="font-bold text-xl text-emerald-700">{formatCurrency(income.net)}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Egresos Card */}
                <Card className="border-t-4 border-t-rose-500 shadow-sm">
                    <CardHeader className="pb-4 border-b">
                        <CardTitle className="flex items-center gap-2 text-rose-700 font-bold text-xl">
                            <TrendingDown className="w-6 h-6" />
                            Egresos (Gastos Acreditables)
                        </CardTitle>
                        <CardDescription>
                            Compras y gastos confirmados en el mes seleccionado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between items-center text-slate-600">
                            <span>Subtotal de Gastos</span>
                            <span className="font-medium text-slate-900">{formatCurrency(expenses.subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600 border-b pb-4">
                            <span>+ IVA Acreditable (16%)</span>
                            <span className="font-medium text-rose-600">{formatCurrency(expenses.iva)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="font-bold text-lg text-slate-800">= Total Pagado</span>
                            <span className="font-bold text-xl text-rose-700">{formatCurrency(expenses.total)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Resumen de IVA */}
            <Card className="border-t-4 border-t-indigo-500 shadow-sm bg-indigo-50/30 print:bg-transparent print:border-slate-300 print:shadow-none">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-indigo-800 print:text-black">
                        <Calculator className="w-6 h-6" />
                        Estimación de IVA
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex-1 space-y-2 w-full">
                            <div className="flex justify-between text-slate-600 print:text-black">
                                <span>IVA Trasladado (Ventas)</span>
                                <span className="font-medium">{formatCurrency(income.iva)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600 print:text-black">
                                <span>- IVA Acreditable (Gastos)</span>
                                <span className="font-medium">{formatCurrency(expenses.iva)}</span>
                            </div>
                        </div>

                        <div className="w-px h-16 bg-slate-300 hidden md:block print:bg-slate-800"></div>

                        <div className="flex-1 text-center md:text-right w-full">
                            <p className="text-sm font-medium text-slate-500 mb-1 print:text-slate-700">
                                {isIvaInFavor ? "IVA a Favor Estimado" : "IVA a Pagar Estimado"}
                            </p>
                            <p className={`text-4xl font-bold tracking-tight ${isIvaInFavor ? "text-emerald-600 print:text-black" : "text-rose-600 print:text-black"}`}>
                                {formatCurrency(Math.abs(ivaDifference))}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
