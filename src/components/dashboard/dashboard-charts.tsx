"use client";

import { AreaChart, Area, XAxis, YAxis, PieChart, Pie, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";

interface CashflowItem {
    name: string;
    Ingresos: number;
    Egresos: number;
}

interface ExpensePieItem {
    name: string;
    valor: number;
    fill?: string;
}

interface DashboardChartsProps {
    cashflowData: CashflowItem[];
    topExpensesData: ExpensePieItem[];
}

const cashflowChartConfig = {
    Ingresos: {
        label: "Ingresos",
        color: "hsl(var(--chart-2))",
    },
    Egresos: {
        label: "Egresos",
        color: "hsl(var(--destructive))",
    },
} satisfies ChartConfig;

export function DashboardCharts({ cashflowData, topExpensesData }: DashboardChartsProps) {
    
    const pieConfig = topExpensesData.reduce((acc, curr) => {
        acc[curr.name] = {
            label: curr.name,
            color: curr.fill
        };
        return acc;
    }, {} as ChartConfig);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6 mt-6">
            <Card className="lg:col-span-4 shadow-sm h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Flujo de Efectivo (6 Meses)</CardTitle>
                    <CardDescription>Comparativa de Ingresos vs Egresos</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                    <ChartContainer config={cashflowChartConfig} className="h-[300px] w-full">
                        <AreaChart data={cashflowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="fillIngresos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-Ingresos)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--color-Ingresos)" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="fillEgresos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-Egresos)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--color-Egresos)" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                            />
                            <YAxis
                                tickFormatter={(value) => `$${value / 1000}k`}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                            <Area
                                type="monotone"
                                dataKey="Ingresos"
                                stroke="var(--color-Ingresos)"
                                fillOpacity={1}
                                fill="url(#fillIngresos)"
                            />
                            <Area
                                type="monotone"
                                dataKey="Egresos"
                                stroke="var(--color-Egresos)"
                                fillOpacity={1}
                                fill="url(#fillEgresos)"
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card className="lg:col-span-3 shadow-sm h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Distribución de Gastos</CardTitle>
                    <CardDescription>Top Categorías este mes</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0 flex items-center justify-center">
                   {topExpensesData.length > 0 ? (
                    <ChartContainer config={pieConfig} className="mx-auto aspect-square w-[300px] flex-1">
                        <PieChart>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Pie
                                data={topExpensesData}
                                dataKey="valor"
                                nameKey="name"
                                innerRadius={60}
                                strokeWidth={2}
                                paddingAngle={2}
                            />
                            <ChartLegend
                                content={<ChartLegendContent className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" />} 
                            />
                        </PieChart>
                    </ChartContainer>
                   ) : (
                       <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                           No hay gastos registrados este mes
                       </div>
                   )}
                </CardContent>
            </Card>
        </div>
    );
}
