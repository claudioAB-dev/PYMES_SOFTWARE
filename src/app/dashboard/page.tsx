import { Suspense } from "react";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Wallet, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { orders, financialAccounts, memberships } from "@/db/schema";
import { and, eq, gte, lte, desc, sum, inArray } from "drizzle-orm";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";

async function getOrganizationId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
        orderBy: [desc(memberships.createdAt)],
    });

    if (userMemberships.length === 0) return null;
    return userMemberships[0].organizationId;
}

export default async function DashboardPage() {
    const organizationId = await getOrganizationId();

    if (!organizationId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h1 className="text-2xl font-bold">Bienvenido</h1>
                <p className="text-muted-foreground">No tienes una organización activa.</p>
            </div>
        );
    }

    const now = new Date();
    const firstDay = startOfMonth(now);
    const lastDay = endOfMonth(now);

    // 1. Total Ventas del Mes
    const [salesResult] = await db
        .select({ value: sum(orders.totalAmount) })
        .from(orders)
        .where(
            and(
                eq(orders.organizationId, organizationId),
                eq(orders.type, 'SALE'),
                eq(orders.status, 'CONFIRMED'),
                gte(orders.createdAt, firstDay),
                lte(orders.createdAt, lastDay)
            )
        );
    const totalSales = Number(salesResult?.value || 0);

    // 2. Total Compras del Mes
    const [purchasesResult] = await db
        .select({ value: sum(orders.totalAmount) })
        .from(orders)
        .where(
            and(
                eq(orders.organizationId, organizationId),
                eq(orders.type, 'PURCHASE'),
                eq(orders.status, 'CONFIRMED'),
                gte(orders.createdAt, firstDay),
                lte(orders.createdAt, lastDay)
            )
        );
    const totalPurchases = Number(purchasesResult?.value || 0);

    // 3. Saldo Total en Bancos/Cajas
    const [balanceResult] = await db
        .select({ value: sum(financialAccounts.balance) })
        .from(financialAccounts)
        .where(
            and(
                eq(financialAccounts.organizationId, organizationId),
                eq(financialAccounts.isActive, true)
            )
        );
    const totalBalance = Number(balanceResult?.value || 0);

    // 4. Cuentas por Cobrar
    const pendingOrders = await db.query.orders.findMany({
        where: and(
            eq(orders.organizationId, organizationId),
            eq(orders.type, 'SALE'),
            eq(orders.status, 'CONFIRMED'),
            inArray(orders.paymentStatus, ['UNPAID', 'PARTIAL'])
        ),
        with: {
            payments: true,
        },
    });

    let accountsReceivable = 0;
    for (const order of pendingOrders) {
        const paidAmount = order.payments.reduce((acc, p) => acc + Number(p.amount), 0);
        accountsReceivable += (Number(order.totalAmount) - paidAmount);
    }

    // Preparar Data para las gráficas
    const incomeExpenseData = [
        { name: 'Ingresos', valor: totalSales },
        { name: 'Gastos', valor: totalPurchases }
    ];

    const cobrado = Math.max(0, totalSales - accountsReceivable);
    const portfolioData = [
        { name: 'Cobrado', valor: cobrado },
        { name: 'Por Cobrar', valor: accountsReceivable }
    ];

    // 5. Últimas Ventas
    const recentSales = await db.query.orders.findMany({
        where: and(
            eq(orders.organizationId, organizationId),
            eq(orders.type, 'SALE')
        ),
        orderBy: [desc(orders.createdAt)],
        limit: 5,
        with: {
            entity: true,
        },
    });

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ingresos del Mes
                        </CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600" suppressHydrationWarning>
                            {formatCurrency(totalSales)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-emerald-600/70">
                            Ventas confirmadas de {format(now, "MMMM", { locale: es })}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Gastos del Mes
                        </CardTitle>
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600" suppressHydrationWarning>
                            {formatCurrency(totalPurchases)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-red-600/70">
                            Compras confirmadas de {format(now, "MMMM", { locale: es })}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Saldo Total en Cuentas
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600" suppressHydrationWarning>
                            {formatCurrency(totalBalance)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-blue-600/70">
                            Suma de bancos y cajas
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Cuentas por Cobrar
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600" suppressHydrationWarning>
                            {formatCurrency(accountsReceivable)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-amber-600/70">
                            Deuda pendiente total
                        </p>
                    </CardContent>
                </Card>
            </div>

            <DashboardCharts
                incomeExpenseData={incomeExpenseData}
                portfolioData={portfolioData}
            />

            <div className="mt-8 space-y-4">
                <h3 className="text-lg font-medium opacity-80">Últimas Ventas</h3>
                <div className="border rounded-md bg-white">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-muted/50 text-muted-foreground border-b">
                            <tr>
                                <th className="px-6 py-4 font-medium">Fecha</th>
                                <th className="px-6 py-4 font-medium">Cliente</th>
                                <th className="px-6 py-4 font-medium text-right">Total</th>
                                <th className="px-6 py-4 font-medium text-center">Estado de Pago</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {recentSales.map((sale) => (
                                <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {format(new Date(sale.createdAt), "dd MMM yyyy", { locale: es })}
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        {sale.entity?.commercialName || "Venta de Mostrador"}
                                    </td>
                                    <td className="px-6 py-4 text-right tabular-nums font-medium">
                                        {formatCurrency(Number(sale.totalAmount))}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                            ${sale.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                sale.paymentStatus === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    'bg-red-50 text-red-700 border-red-200'}`}>
                                            {sale.paymentStatus === 'PAID' ? 'Pagado' :
                                                sale.paymentStatus === 'PARTIAL' ? 'Parcial' :
                                                    'Pendiente'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {recentSales.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        No se encontraron ventas para esta organización.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
