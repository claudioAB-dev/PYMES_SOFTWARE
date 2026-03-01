import { Server } from "lucide-react";
import { cookies } from "next/headers";
import { SatSyncClient } from "./sat-sync-client";
import { ManualUploadForm } from "./manual-upload-form";

export default async function SatSyncPage() {
    const cookieStore = await cookies();
    const organizationId = cookieStore.get('axioma_active_org')?.value || "";

    // In a real scenario you would probably want to show an empty state or redirect
    // if there's no organizationId, but since the layout handles that, we can assume it exists.

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
