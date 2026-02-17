import { Suspense } from "react";
import { getDashboardMetrics, getRecentSales, getSalesChartData } from "./actions";
import { KPICard } from "@/components/dashboard/KPICard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { RecentSalesList } from "@/components/dashboard/RecentSalesList";
import { DollarSign, CreditCard, ShoppingBag, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
    const metrics = await getDashboardMetrics();
    const recentSales = await getRecentSales();
    const salesChartData = await getSalesChartData();

    if (!metrics) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <h1 className="text-2xl font-bold">Bienvenido</h1>
                <p className="text-muted-foreground">Cargando datos del dashboard...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Ventas del Mes"
                    value={metrics.sales}
                    icon={DollarSign}
                    description="Total de órdenes confirmadas"
                />
                <KPICard
                    title="Ingresos del Mes"
                    value={metrics.revenue}
                    icon={CreditCard}
                    description="Pagos recibidos"
                />
                <KPICard
                    title="Por Cobrar"
                    value={metrics.receivables}
                    icon={ShoppingBag}
                    description="Saldo pendiente total"
                />
                <KPICard
                    title="Órdenes del Mes"
                    value={metrics.ordersCount}
                    icon={Package}
                    isCurrency={false}
                    description="Cantidad de órdenes"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <SalesChart data={salesChartData || []} />
                <div className="col-span-4 lg:col-span-3">
                    <RecentSalesList sales={recentSales || []} />
                </div>
            </div>
        </div>
    );
}
