import { getReceivablesAging } from "./actions";
import { AgingTable, columns } from "./aging-table";

export default async function ReceivablesPage() {
    const data = await getReceivablesAging();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Cuentas por Cobrar</h2>
                    <p className="text-muted-foreground mt-2">
                        Resumen de saldos pendientes y antigüedad de deuda de tus clientes.
                    </p>
                </div>
            </div>

            <div className="mt-8">
                <AgingTable columns={columns as any} data={data} />
            </div>
        </div>
    );
}
