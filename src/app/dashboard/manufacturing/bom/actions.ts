"use server";

import { db } from "@/db";
import { bomLines } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { BomFormValues } from "@/lib/validators/manufacturing";

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
