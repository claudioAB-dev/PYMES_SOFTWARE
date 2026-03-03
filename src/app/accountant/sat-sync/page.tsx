import { Server, AlertCircle, Building2 } from "lucide-react";
import { cookies } from "next/headers";
import { SatSyncClient } from "./sat-sync-client";
import { ManualUploadForm } from "./manual-upload-form";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EmptyState } from "@/components/ui/empty-state";

export default async function SatSyncPage() {
    const cookieStore = await cookies();
    const organizationId = cookieStore.get('axioma_active_org')?.value;

    if (!organizationId) {
        return (
            <div className="flex-1 space-y-6 p-8 pt-16 max-w-7xl mx-auto flex flex-col justify-center min-h-[50vh]">
                <EmptyState
                    icon={Building2}
                    title="Ningún cliente seleccionado"
                    description="Selecciona una empresa en el menú superior o invita a tu primer cliente para descargar comprobantes."
                />
            </div>
        );
    }

    let activeOrgName = "Organización Actual";
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
        columns: { name: true }
    });
    if (org) activeOrgName = org.name;

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Server className="w-8 h-8 text-primary" />
                        Sincronización SAT
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-3xl bg-transparent">
                        Gestiona la descarga masiva de tus XMLs directamente desde los servidores del SAT de forma asíncrona.
                    </p>
                </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-200 text-blue-800 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <p className="font-medium text-sm">
                    Solicitando descarga para: <span className="font-bold">{activeOrgName}</span>
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <SatSyncClient organizationId={organizationId} />
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <ManualUploadForm organizationId={organizationId} />
                </div>
            </div>
        </div>
    );
}
