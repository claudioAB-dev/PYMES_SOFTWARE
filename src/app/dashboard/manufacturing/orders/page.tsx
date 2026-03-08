import { CreateOrderSheet } from "./create-order-sheet";
import { ProductionOrdersTable } from "@/components/manufacturing/ProductionOrdersTable";

export default async function ManufacturingOrdersPage() {
    const orders = await getProductionOrders();
    const products = await getManufacturableProducts();

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Órdenes de Producción</h2>
                    <p className="text-muted-foreground">
                        Gestiona y monitorea el estado de la producción en planta.
                    </p>
                </div>
                <CreateOrderSheet products={products} />
            </div>

            <ProductionOrdersTable orders={orders as any} />
        </div>
    );
}

// Temporary actions within the file to fetch needed data for the page load
import { db } from "@/db";
import { productionOrders, products as productsSchema, memberships } from "@/db/schema";
import { eq, desc, and, or } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

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

async function getProductionOrders() {
    try {
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
    } catch (error) {
        return [];
    }
}

async function getManufacturableProducts() {
    try {
        const { organizationId } = await getOrganizationId();
        return await db.query.products.findMany({
            where: and(
                eq(productsSchema.organizationId, organizationId),
                eq(productsSchema.archived, false),
                or(
                    eq(productsSchema.itemType, 'finished_good'),
                    eq(productsSchema.itemType, 'sub_assembly')
                )
            ),
            orderBy: [desc(productsSchema.name)],
        });
    } catch (error) {
        return [];
    }
}
