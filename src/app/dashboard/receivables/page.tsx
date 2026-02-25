import { getReceivablesAging } from "./actions";
import { AgingTable, columns } from "./aging-table";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";

export default async function ReceivablesPage() {
    const data = await getReceivablesAging();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Cuentas por Cobrar</h2>
                    <p className="text-muted-foreground mt-2">
                        Resumen de saldos pendientes y antigüedad de deuda de tus clientes.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" asChild>
                        <a href="/api/reports/receivables/export" download>
                            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                            Exportar a Excel
                        </a>
                    </Button>
                </div>
            </div>

            <div className="mt-8">
                <AgingTable columns={columns as any} data={data} />
            </div>
        </div>
    );
}
