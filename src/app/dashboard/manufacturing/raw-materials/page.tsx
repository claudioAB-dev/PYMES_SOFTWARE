import { getRawMaterials } from "./actions";
import { RawMaterialsTable, columns } from "./raw-materials-table";
import { CreateRawMaterialSheet } from "./create-raw-material-sheet";

export default async function RawMaterialsPage() {
    const rawMaterials = await getRawMaterials();

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Catálogo de Materias Primas e Insumos</h2>
                    <p className="text-muted-foreground">
                        Gestiona los componentes y sub-ensamblajes utilizados en las recetas.
                    </p>
                </div>
                <CreateRawMaterialSheet />
            </div>

            {/* @ts-ignore */}
            <RawMaterialsTable columns={columns} data={rawMaterials} />
        </div>
    );
}
