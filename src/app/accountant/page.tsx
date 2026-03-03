import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { memberships, orders } from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link2, Building2, HandCoins, Building } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { CopyLinkButton } from "./components/copy-link-button";

export const dynamic = 'force-dynamic';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}

export default async function AccountantDashboard() {
    // 1. Autenticación y Carga de Datos
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const userId = user.id;

    // Obtener organizaciones donde el usuario es ACCOUNTANT
    const userMemberships = await db.query.memberships.findMany({
        where: and(
            eq(memberships.userId, userId),
            eq(memberships.role, 'ACCOUNTANT')
        ),
        with: {
            organization: true
        }
    });

    const orgs = userMemberships.map(m => m.organization);
    const orgIds = orgs.map(org => org.id);

    // 2. Interfaz - Sección Superior (Adquisición y Comisiones)
    // Calcular comisiones proyectadas (MVP: $500 por cada PyME)
    const projectedCommissions = orgs.length * 500;

    // Link de invitación dinámico
    const invitationLink = `https://axiomaerp.com/register?ref=${userId}`;

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const monthName = format(now, "MMMM", { locale: es });
    const currentMonthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    // 3. Interfaz - Tabla de Clientes (PyMEs)
    // Obtener las métricas por PyME del mes en curso leyendo exclusivamente de orders (status = CONFIRMED)
    let orgMetrics: Record<string, { totalVentas: number; ivaTrasladado: number; retenciones: number }> = {};

    if (orgIds.length > 0) {
        const metricsData = await db.select({
            organizationId: orders.organizationId,
            subtotalAmount: sql<number>`sum(${orders.subtotalAmount})`,
            totalTaxAmount: sql<number>`sum(${orders.totalTaxAmount})`,
            totalRetentionAmount: sql<number>`sum(${orders.totalRetentionAmount})`,
        })
            .from(orders)
            .where(
                and(
                    inArray(orders.organizationId, orgIds),
                    eq(orders.status, 'CONFIRMED'),
                    eq(orders.type, 'SALE'),
                    sql`${orders.createdAt} >= ${currentMonthStart.toISOString()}`,
                    sql`${orders.createdAt} <= ${currentMonthEnd.toISOString()}`
                )
            )
            .groupBy(orders.organizationId);

        orgMetrics = metricsData.reduce((acc, row) => {
            acc[row.organizationId] = {
                totalVentas: Number(row.subtotalAmount || 0),
                ivaTrasladado: Number(row.totalTaxAmount || 0),
                retenciones: Number(row.totalRetentionAmount || 0),
            };
            return acc;
        }, {} as Record<string, { totalVentas: number; ivaTrasladado: number; retenciones: number }>);
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto" suppressHydrationWarning>
            {/* Header */}
            <div suppressHydrationWarning>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel de Partners</h1>
                <p className="text-muted-foreground mt-1 text-lg">
                    Gestiona las PyMEs de tus clientes y tus comisiones como Partner de Axioma.
                </p>
            </div>

            {/* Adquisición y Comisiones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-t-4 border-t-indigo-500 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-indigo-700">
                            <Link2 className="w-5 h-5" />
                            Tu Enlace de Invitación
                        </CardTitle>
                        <CardDescription>
                            Comparte este enlace con tus clientes para que se registren en Axioma y queden vinculados a ti.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <code className="flex-1 bg-slate-100 p-3 rounded-md text-sm text-slate-800 break-all border border-slate-200">
                                {invitationLink}
                            </code>
                            <CopyLinkButton link={invitationLink} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-t-4 border-t-emerald-500 shadow-sm bg-emerald-50/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-emerald-700">
                            <HandCoins className="w-5 h-5" />
                            Comisiones Proyectadas ({currentMonthLabel})
                        </CardTitle>
                        <CardDescription>
                            Comisión basada en la cantidad de PyMEs conectadas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-3">
                            <h2 className="text-4xl font-bold text-emerald-700">{formatCurrency(projectedCommissions)}</h2>
                            <span className="text-sm text-emerald-800/70 mb-1 font-medium">/ mes</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700/80">
                            <Building2 className="w-4 h-4" />
                            <span>{orgs.length} PyMEs conectadas x $500 MXN</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabla de Clientes (PyMEs) */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Building className="w-5 h-5 text-indigo-600" />
                        Tus Clientes (Mes en curso: {currentMonthLabel})
                    </CardTitle>
                    <CardDescription>
                        Desempeño de ventas e impuestos en el mes actual basado en órdenes confirmadas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="pl-6 font-semibold">Nombre de la PyME</TableHead>
                                <TableHead className="font-semibold text-right">Total Ventas</TableHead>
                                <TableHead className="font-semibold text-right">IVA Trasladado</TableHead>
                                <TableHead className="font-semibold text-right">Retenciones</TableHead>
                                <TableHead className="font-semibold text-center pr-6">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orgs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                        No tienes PyMEs vinculadas. ¡Comparte tu enlace de invitación!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orgs.map((org) => {
                                    const m = orgMetrics[org.id] || { totalVentas: 0, ivaTrasladado: 0, retenciones: 0 };
                                    return (
                                        <TableRow key={org.id} className="hover:bg-slate-50 transition-colors">
                                            <TableCell className="pl-6 font-medium text-slate-900 border-l-4 border-l-transparent hover:border-l-indigo-400">
                                                {org.name}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-700 font-medium">
                                                {formatCurrency(m.totalVentas)}
                                            </TableCell>
                                            <TableCell className="text-right text-rose-600 font-medium">
                                                {formatCurrency(m.ivaTrasladado)}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-600 font-medium">
                                                {formatCurrency(m.retenciones)}
                                            </TableCell>
                                            <TableCell className="text-center pr-6">
                                                <Button variant="outline" size="sm">
                                                    Ver detalles
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
