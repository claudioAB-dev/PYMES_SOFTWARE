import { Scale, AlertCircle } from "lucide-react";
import { cookies } from "next/headers";
import { ReconciliationClient } from "./reconciliation-client";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function ReconciliationPage() {
    const cookieStore = await cookies();
    const organizationId = cookieStore.get('axioma_active_org')?.value || "";

    let activeOrgName = "Organización Actual";
    if (organizationId) {
        const org = await db.query.organizations.findFirst({
            where: eq(organizations.id, organizationId),
            columns: { name: true }
        });
        if (org) activeOrgName = org.name;
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Scale className="w-8 h-8 text-primary" />
                        Conciliación Fiscal
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-3xl bg-transparent">
                        Compara los XMLs descargados del SAT contra los registros operativos de la empresa (Ventas y Compras).
                    </p>
                </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-200 text-blue-800 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <p className="font-medium text-sm">
                    Mostrando conciliación para: <span className="font-bold">{activeOrgName}</span>
                </p>
            </div>

            <div className="grid gap-6">
                <ReconciliationClient />
            </div>
        </div>
    );
}
