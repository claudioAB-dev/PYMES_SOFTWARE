import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Building2, ArrowRight, Activity, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InviteClientDialog } from "./components/invite-client-dialog";

export default async function AccountantDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const managedCompanies = await db.query.memberships.findMany({
        where: and(
            eq(memberships.userId, user.id),
            eq(memberships.role, 'ACCOUNTANT')
        ),
        with: {
            organization: true,
        },
    });

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50"></div>

                <div className="relative">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mis Empresas</h1>
                    <p className="text-slate-500 mt-2 text-lg max-w-xl">
                        Bienvenido a tu centro de mando. Aquí puedes gestionar la información contable y financiera de todos tus clientes desde un solo lugar.
                    </p>
                </div>

                <div className="flex gap-4 relative">
                    <div className="bg-indigo-50 px-4 py-3 rounded-xl border border-indigo-100 min-w-32 hidden sm:block">
                        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Empresas</p>
                        <p className="text-2xl font-bold text-slate-900">{managedCompanies.length}</p>
                    </div>
                    {/* Reverse Invitation Button */}
                    <div className="flex items-center">
                        <InviteClientDialog />
                    </div>
                </div>
            </div>

            {/* Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {managedCompanies.map((membership) => (
                    <div
                        key={membership.organizationId}
                        className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 flex flex-col group overflow-hidden"
                    >
                        <div className="p-6 flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-100 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                                    <Building2 className="w-7 h-7 text-indigo-600" />
                                </div>
                                <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                                    Activo
                                </span>
                            </div>

                            <div className="mt-4">
                                <h3 className="font-bold text-xl text-slate-900 truncate mb-1 group-hover:text-indigo-600 transition-colors">
                                    {membership.organization.name}
                                </h3>
                                <div className="flex flex-col gap-1 mt-3">
                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                        <span className="w-4 text-center">📄</span> RFC: {membership.organization.taxId || "No registrado"}
                                    </p>
                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-slate-400" /> Nivel de acceso: Total
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 border-t flex justify-between items-center group-hover:bg-indigo-50/30 transition-colors">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-400" />
                                <span className="text-xs text-slate-500">Rol: Contador</span>
                            </div>

                            {/* We point this to their specific dashboard with a query param or cookie in the future. For now, it just redirects to the main dashboard. The app should later handle the org context. */}
                            <Button asChild size="sm" className="bg-white text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 hover:border-transparent transition-all shadow-sm">
                                <Link href={`/dashboard`}>
                                    Acceder <ArrowRight className="w-4 h-4 ml-1.5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {managedCompanies.length === 0 && (
                <div className="text-center py-20 bg-white border rounded-2xl border-dashed border-slate-300 max-w-2xl mx-auto mt-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Sin empresas asignadas</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        Actualmente no tienes permisos de Contador en ninguna empresa. Solicita a tus clientes que te envíen una invitación.
                    </p>
                </div>
            )}
        </div>
    );
}
