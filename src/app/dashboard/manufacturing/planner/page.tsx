import { db } from "@/db";
import { products as productsSchema, productionOrders, bomLines, memberships } from "@/db/schema";
import { eq, desc, and, or, inArray } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { calculateProductionCapacity } from "./actions";
import { PlannerSuggestionCard } from "@/components/manufacturing/PlannerSuggestionCard";
import { ProductionOrdersCalendar } from "@/components/manufacturing/ProductionOrdersCalendar";

async function getOrganizationId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });
    if (userMemberships.length === 0) throw new Error("No organization found");

    return { organizationId: userMemberships[0].organizationId };
}

async function getProductsWithBomAndCapacity() {
    const { organizationId } = await getOrganizationId();

    // 1. Get products that are finished_goods or sub_assembly and have a BOM
    const bomParents = await db.query.bomLines.findMany({
        columns: {
            parentProductId: true
        }
    });

    const parentIds = [...new Set(bomParents.map(b => b.parentProductId))];

    if (parentIds.length === 0) return [];

    const products = await db.query.products.findMany({
        where: and(
            eq(productsSchema.organizationId, organizationId),
            eq(productsSchema.archived, false),
            inArray(productsSchema.id, parentIds),
            or(
                eq(productsSchema.itemType, 'finished_good'),
                eq(productsSchema.itemType, 'sub_assembly'),
                and(
                    eq(productsSchema.itemType, 'raw_material'),
                    eq(productsSchema.isManufacturable, true)
                )
            )
        ),
        orderBy: [desc(productsSchema.name)]
    });

    // 2. Calculate capacity for each
    const productsWithCapacity = await Promise.all(
        products.map(async (p) => {
            const capacity = await calculateProductionCapacity(p.id);
            return {
                id: p.id,
                name: p.name,
                sku: p.sku,
                capacity
            };
        })
    );

    return productsWithCapacity;
}

async function getExistingOrders() {
    const { organizationId } = await getOrganizationId();

    return await db.query.productionOrders.findMany({
        where: eq(productionOrders.organizationId, organizationId),
        orderBy: [desc(productionOrders.startDate)],
        with: {
            product: {
                columns: { name: true, sku: true, uom: true }
            }
        }
    });
}

export default async function PlannerPage() {
    const productsList = await getProductsWithBomAndCapacity();
    const orders = await getExistingOrders();

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Calendario de Planificación</h2>
                <p className="text-muted-foreground">
                    Planificador de Producción: Sugerencias y Calendario.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
                {/* Columna Izquierda (Sugerencias 30%) - approx col-span-4 */}
                <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-4 overflow-y-auto border-r pr-4">
                    <h3 className="font-semibold text-lg pb-2 border-b">Productos Manufacturables</h3>
                    {productsList.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay productos con lista de materiales (BOM) configurada.</p>
                    ) : (
                        productsList.map(product => (
                            <PlannerSuggestionCard key={product.id} product={product} />
                        ))
                    )}
                </div>

                {/* Columna Derecha (Calendario 70%) - approx col-span-8 */}
                <div className="md:col-span-8 lg:col-span-9 flex flex-col bg-card rounded-lg border shadow-sm">
                    <div className="p-4 border-b">
                        <h3 className="font-semibold text-lg">Agenda de Producción</h3>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                        <ProductionOrdersCalendar orders={orders as any} />
                    </div>
                </div>
            </div>
        </div>
    );
}
