import { formatCurrency } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Wallet, AlertCircle, AlertTriangle, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { orders, memberships, treasuryTransactions } from "@/db/schema";
import { and, eq, gte, lte, desc, sum, inArray } from "drizzle-orm";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";
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

export async function DashboardContent() {
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

    // 1. Ingresos Totales del Mes
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

    // 2. Egresos Totales del Mes
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

    // Utilidad Bruta
    const grossProfit = totalSales - totalPurchases;

    // 3. Cuentas por Cobrar (todas las ventas pendientes)
    const pendingOrdersDetailed = await db.query.orders.findMany({
        where: and(
            eq(orders.organizationId, organizationId),
            eq(orders.type, 'SALE'),
            eq(orders.status, 'CONFIRMED'),
            inArray(orders.paymentStatus, ['UNPAID', 'PARTIAL'])
        ),
        with: { payments: true, entity: true }
    });
    
    let accountsReceivable = 0;
    for (const order of pendingOrdersDetailed) {
        const paidAmount = order.payments.reduce((acc, p) => acc + Number(p.amount), 0);
        accountsReceivable += (Number(order.totalAmount) - paidAmount);
    }

    // 4. Flujo de Efectivo (Últimos 6 meses)
    const sixMonthsAgo = startOfMonth(subMonths(now, 5));
    const sixMonthOrders = await db.query.orders.findMany({
        where: and(
            eq(orders.organizationId, organizationId),
            eq(orders.status, 'CONFIRMED'),
            gte(orders.createdAt, sixMonthsAgo),
            lte(orders.createdAt, lastDay)
        ),
        columns: { totalAmount: true, type: true, createdAt: true }
    });

    const monthsMap = new Map();
    for (let i = 5; i >= 0; i--) {
        const m = startOfMonth(subMonths(now, i));
        const key = format(m, 'MMM yyyy', { locale: es });
        monthsMap.set(key, { 
            name: format(m, 'MMM', { locale: es }).replace(/^\w/, c => c.toUpperCase()),
            Ingresos: 0, 
            Egresos: 0 
        });
    }

    for (const o of sixMonthOrders) {
        const key = format(o.createdAt, 'MMM yyyy', { locale: es });
        if (monthsMap.has(key)) {
            const item = monthsMap.get(key);
            if (o.type === 'SALE') item.Ingresos += Number(o.totalAmount);
            if (o.type === 'PURCHASE') item.Egresos += Number(o.totalAmount);
        }
    }
    const cashflowData = Array.from(monthsMap.values());

    // 5. Top 5 Gastos por Categoría (Mes Actual)
    const expensesThisMonth = await db.query.treasuryTransactions.findMany({
        where: and(
            eq(treasuryTransactions.organizationId, organizationId),
            eq(treasuryTransactions.type, 'EXPENSE'),
            gte(treasuryTransactions.date, firstDay),
            lte(treasuryTransactions.date, lastDay)
        ),
        columns: { category: true, amount: true }
    });

    const expensesByCategory = expensesThisMonth.reduce((acc, curr) => {
        const cat = curr.category;
        acc[cat] = (acc[cat] || 0) + Number(curr.amount);
        return acc;
    }, {} as Record<string, number>);

    const categoryNames: Record<string, string> = {
        'SALE': 'Ventas',
        'PURCHASE': 'Compras (Insumos)',
        'PAYROLL': 'Nómina',
        'OPERATING_EXPENSE': 'Gastos Operativos',
        'TAX': 'Impuestos',
        'CAPITAL': 'Capital/Otros'
    };

    const topExpensesData = Object.entries(expensesByCategory)
        .map(([category, amount]) => ({ 
            name: categoryNames[category] || category,
            valor: amount
        }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5);

    const pieData = topExpensesData.map((d, i) => ({
        ...d,
        fill: `hsl(var(--chart-${(i % 5) + 1}))`
    }));

    // 6. Top 5 Clientes Morosos (Facturas más antiguas sin pagar)
    const topMorosos = pendingOrdersDetailed
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-l-4 border-l-emerald-500 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ingresos del Mes
                        </CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500" suppressHydrationWarning>
                            {formatCurrency(totalSales)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Ventas confirmadas de {format(now, "MMM yyyy", { locale: es })}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-destructive shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Egresos del Mes
                        </CardTitle>
                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive" suppressHydrationWarning>
                            {formatCurrency(totalPurchases)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Compras y gastos confirmados
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Utilidad Bruta
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-500" suppressHydrationWarning>
                            {formatCurrency(grossProfit)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Ingresos - Egresos
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/20 shadow-sm transition-all hover:shadow-md hover:bg-amber-50/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-500">
                            Cuentas por Cobrar
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-500" suppressHydrationWarning>
                            {formatCurrency(accountsReceivable)}
                        </div>
                        <p className="text-xs font-medium text-amber-600/70 mt-1 flex items-center">
                            Capital atrapado
                        </p>
                    </CardContent>
                </Card>
            </div>

            <DashboardCharts
                cashflowData={cashflowData}
                topExpensesData={pieData}
            />

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-1 shadow-sm h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Top 5 Clientes Morosos
                        </CardTitle>
                        <CardDescription>
                            Facturas más antiguas pendientes de pago
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="space-y-4">
                            {topMorosos.map((order) => {
                                const paidAmount = order.payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0;
                                const pendingAmount = Number(order.totalAmount) - paidAmount;
                                
                                return (
                                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground transition-colors hover:bg-muted/50">
                                        <div className="grid gap-1">
                                            <p className="text-sm font-medium leading-none">
                                                {(order as any).entity?.commercialName || "Cliente Desconocido"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Hace {Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 3600 * 24))} días
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-amber-600">
                                                    {formatCurrency(pendingAmount)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">De {formatCurrency(Number(order.totalAmount))}</p>
                                            </div>
                                            <Button size="icon" variant="outline" className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0 transition-transform active:scale-95">
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                            {topMorosos.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                    No hay clientes con atrasos. ¡Excelente!
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <div className="hidden md:block col-span-1 border-2 border-dashed rounded-lg flex items-center justify-center p-8 bg-muted/10">
                    <div className="text-center flex flex-col items-center">
                        <Wallet className="h-10 w-10 text-muted-foreground/30 mb-2" />
                        <h3 className="text-lg font-medium text-muted-foreground/50">Más reportes próximamente</h3>
                        <p className="text-sm text-muted-foreground/40 mt-1 max-w-[250px]">
                            Pronto añadiremos más visualizaciones para mejorar el análisis de tu negocio.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
