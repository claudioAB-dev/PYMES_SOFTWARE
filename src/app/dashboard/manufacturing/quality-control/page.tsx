import { getQuarantineBatches } from "@/app/actions/quality-control";
import QualityControlClient from "./quality-control-client";

export default async function QualityControlPage() {
    const batches = await getQuarantineBatches();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Control de Calidad (Cuarentena)</h2>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
                Gestión y liberación de lotes de producción terminados.
            </p>

            <QualityControlClient initialBatches={batches} />
        </div>
    );
}
