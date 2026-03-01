import { getActiveOrgId, validateAccountantAccess } from "@/lib/accountant/context";
import { db } from "@/db";
import { fiscalDocuments, organizations } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/dashboard/KPICard";
import { TrendingUp, TrendingDown, Landmark, CalendarClock, Building2 } from "lucide-react";

export default async function AccountantDashboard() {
    let organizationId: string;
    try {
        organizationId = await getActiveOrgId();
        await validateAccountantAccess(organizationId);
    } catch (error) {
        return (
            <div className="p-8 text-center" suppressHydrationWarning>
                <div className="bg-white border rounded-2xl p-12 max-w-2xl mx-auto mt-12 shadow-sm">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-slate-900 mb-2">Acceso Denegado</h3>
                    <p className="text-slate-500">
                        No tienes acceso a ninguna empresa o debes iniciar sesión nuevamente.
                    </p>
                </div>
            </div>
        );
    }

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId)
    });

    if (!org) {
        return (
            <div className="p-8 text-center text-muted-foreground" suppressHydrationWarning>
                Empresa no encontrada.
            </div>
        );
    }

    // Current month boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Queries directly via Drizzle
    const data = await db.select({
        type: fiscalDocuments.type,
        totalAmount: sql<number>`sum(${fiscalDocuments.total})`,
        totalTax: sql<number>`sum(${fiscalDocuments.tax})`
    }).from(fiscalDocuments)
        .where(
            and(
                eq(fiscalDocuments.organizationId, organizationId),
                sql`${fiscalDocuments.issueDate} >= ${startOfMonth.toISOString()}`,
                sql`${fiscalDocuments.issueDate} <= ${endOfMonth.toISOString()}`
            )
        )
        .groupBy(fiscalDocuments.type);

    let ingresos = 0;
    let egresos = 0;

    data.forEach(row => {
        if (row.type === 'I') {
            ingresos += Number(row.totalAmount || 0);
        }
        if (row.type === 'E') {
            egresos += Number(row.totalAmount || 0);
        }
    });

    // Estimando el 16% de la diferencia entre ingresos y egresos
    const ivaEstimado = (ingresos - egresos) * 0.16;

    // Latest SAT synchronization date
    const latestDoc = await db.query.fiscalDocuments.findFirst({
        where: eq(fiscalDocuments.organizationId, organizationId),
        orderBy: [desc(fiscalDocuments.createdAt)]
    });

    let syncStatus = "Sin sincronizar";
    if (latestDoc?.createdAt) {
        syncStatus = new Intl.DateTimeFormat("es-MX", {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(latestDoc.createdAt);
    }

    const uncapitalizedMonth = new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(startOfMonth);
    const currentMonthLabel = uncapitalizedMonth.charAt(0).toUpperCase() + uncapitalizedMonth.slice(1);

    return (
        <div className="space-y-8 max-w-6xl mx-auto" suppressHydrationWarning>
            {/* Identity Banner */}
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                        <Building2 className="w-5 h-5 text-indigo-700" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Operando como</p>
                        <h2 className="text-lg font-bold text-slate-900">{org.name}</h2>
                    </div>
                </div>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm px-3 py-1 text-sm font-semibold">
                    Sesión Activa
                </Badge>
            </div>

            {/* Dashboard Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard General</h1>
                <p className="text-muted-foreground mt-1 text-lg">
                    Resumen financiero y fiscal del mes de {currentMonthLabel}.
                </p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <KPICard
                    title="IVA Estimado a Pagar"
                    value={Math.max(ivaEstimado, 0)} // Optional max 0 to not show negative VAT as "to pay", actually negative means balance in favor, so we let it be as they requested
                    icon={Landmark}
                    description={`Calculado al 16% de res. (${currentMonthLabel})`}
                    isCurrency={true}
                />

                <KPICard
                    title="Ingresos Totales (CFDI)"
                    value={ingresos}
                    icon={TrendingUp}
                    description={`Suma comprobantes ingreso (${currentMonthLabel})`}
                    isCurrency={true}
                />

                <KPICard
                    title="Estatus de Sincronización"
                    value={syncStatus}
                    icon={CalendarClock}
                    description="Última descarga SAT"
                    isCurrency={false}
                />
            </div>

        </div>
    );
}
