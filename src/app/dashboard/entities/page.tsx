import { getEntities } from "./actions";
import { EntityTable, columns } from "./entity-table";
import { CreateEntitySheet } from "./create-entity-sheet";

export default async function EntitiesPage() {
    const entities = await getEntities();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Clientes y Proveedores</h2>
                    <p className="text-muted-foreground">
                        Administra las entidades comerciales de tu organización.
                    </p>
                </div>
                <CreateEntitySheet />
            </div>

            {/* We cast entities to any because of rough type matching between Drizzle result and Table definition.
          In a stricter setup we would define shared types or mappers. */}
            {/* @ts-ignore */}
            <EntityTable columns={columns} data={entities} />
        </div>
    );
}
