"use server";

import { db } from "@/db";
import { bomLines, products, memberships } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { BomFormValues } from "@/lib/validators/manufacturing";
import { createClient } from "@/lib/supabase/server";

async function getOrganizationId() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) throw new Error("No organization found");

    return {
        organizationId: userMemberships[0].organizationId,
        role: userMemberships[0].role,
        user
    };
}

export async function getProductsForBom() {
    try {
        const { organizationId } = await getOrganizationId();

        const data = await db.query.products.findMany({
            where: and(
                eq(products.organizationId, organizationId),
                eq(products.archived, false),
                inArray(products.itemType, ['finished_good', 'raw_material', 'sub_assembly'])
            ),
            orderBy: [desc(products.createdAt)],
            columns: {
                id: true,
                name: true,
                sku: true,
                itemType: true,
                uom: true,
                cost: true,
            }
        });

        // Format to match BomWrapper expected Product interface
        return data.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            itemType: p.itemType,
            uom: p.uom,
            cost: p.cost,
        }));
    } catch (error) {
        console.error("Error fetching products for BOM:", error);
        return [];
    }
}

export async function saveBomAction(data: BomFormValues) {
    try {
        await db.transaction(async (tx) => {
            // Paso 1: Elimina todos los registros existentes para este parent_product_id
            await tx
                .delete(bomLines)
                .where(eq(bomLines.parentProductId, data.parent_product_id));

            // Paso 2: Inserta el nuevo array de componentes
            if (data.components.length > 0) {
                const componentsToInsert = data.components.map((comp) => ({
                    parentProductId: data.parent_product_id,
                    componentProductId: comp.component_product_id,
                    quantity: comp.quantity.toString(),
                    scrapFactor: comp.scrap_factor.toString(),
                    uom: comp.uom,
                    unitCost: comp.unit_cost.toString(),
                }));

                await tx.insert(bomLines).values(componentsToInsert);
            }
        });

        // Revalidación para refrescar la vista del producto actual
        revalidatePath(`/dashboard/products/${data.parent_product_id}`);

        return {
            success: true,
            message: "Lista de materiales guardada correctamente.",
        };
    } catch (error: any) {
        console.error("Error al guardar la lista de materiales:", error);
        return {
            success: false,
            message: "Ocurrió un error al guardar la lista de materiales.",
            error: error?.message || error,
        };
    }
}
