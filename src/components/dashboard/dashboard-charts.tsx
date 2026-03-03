"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface IncomeExpenseData {
    name: string;
    valor: number;
}

interface PortfolioData {
    name: string;
    valor: number;
}

interface DashboardChartsProps {
    incomeExpenseData: IncomeExpenseData[];
    portfolioData: PortfolioData[];
}

const COLORS = ["#10b981", "#ef4444"]; // Emerald (Ingresos), Red (Gastos)
const PIE_COLORS = ["#10b981", "#f59e0b"]; // Emerald (Cobrado), Amber (Por Cobrar)

export function DashboardCharts({ incomeExpenseData, portfolioData }: DashboardChartsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-medium opacity-80">Ingresos vs Gastos del Mes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={incomeExpenseData}>
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                                />
                                <YAxis
                                    tickFormatter={(value) => `$${value / 1000}k`}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                    width={50}
                                />
                                <Tooltip
                                    formatter={(value: number | undefined) => formatCurrency(value || 0)}
                                    cursor={{ fill: "transparent" }}
                                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                                />
                                <Bar
                                    dataKey="valor"
                                    radius={[4, 4, 0, 0]}
                                >
                                    {
                                        incomeExpenseData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-medium opacity-80">Estado de Cartera</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-72 flex flex-col justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={portfolioData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="valor"
                                    stroke="none"
                                >
                                    {portfolioData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(typeof value === 'number' ? value : 0)}
                                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-6 mt-2">
                            {portfolioData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                    />
                                    <span className="text-sm font-medium">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
