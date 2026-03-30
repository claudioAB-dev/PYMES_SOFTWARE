"use server";

import { db } from "@/db";
import { productBatches, products, inventoryMovements, memberships } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Decimal } from "decimal.js";

async function getOrganizationId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) {
        throw new Error("No organization found");
    }

    return {
        organizationId: userMemberships[0].organizationId,
        user
    };
}

export async function getQuarantineBatches() {
    const { organizationId } = await getOrganizationId();

    // Fetch batches in QUARANTINE associated with products of the organization
    // Using simple query via products relation
    const batches = await db.query.productBatches.findMany({
        where: eq(productBatches.status, 'QUARANTINE'),
        with: {
            product: true
        },
        orderBy: [desc(productBatches.createdAt)]
    });

    // Filter by organization (since productBatches doesn't have orgId directly, we filter via product)
    return batches.filter(b => b.product?.organizationId === organizationId);
}

export async function updateBatchQualityStatus(batchId: string, newStatus: 'AVAILABLE' | 'REJECTED', notes?: string) {
    try {
        const { organizationId, user } = await getOrganizationId();

        const batch = await db.query.productBatches.findFirst({
            where: eq(productBatches.id, batchId),
            with: {
                product: true
            }
        });

        if (!batch || batch.product.organizationId !== organizationId) {
            throw new Error("Lote no encontrado o acceso denegado.");
        }

        if (batch.status !== 'QUARANTINE') {
            throw new Error(`El lote ya fue procesado y su estado es: ${batch.status}`);
        }

        await db.transaction(async (tx) => {
            // Update batch status and notes
            await tx.update(productBatches)
                .set({ 
                    status: newStatus,
                    qualityNotes: notes || null,
                    updatedAt: new Date()
                })
                .where(eq(productBatches.id, batchId));

            // If approved, we must increase the product stock and register the movement
            // Because stock wasn't actually increased in completeProductionOrderAction
            if (newStatus === 'AVAILABLE') {
                const currentStockRaw = batch.product.stock;
                const previousStockDec = new Decimal(currentStockRaw as string);
                const quantityDec = new Decimal(batch.initialQuantity as string);
                const newStockDec = previousStockDec.plus(quantityDec);

                await tx.update(products)
                    .set({ stock: newStockDec.toString() })
                    .where(eq(products.id, batch.product.id));

                await tx.insert(inventoryMovements).values({
                    organizationId,
                    productId: batch.product.id,
                    type: 'ADJUSTMENT',
                    quantity: quantityDec.toString(),
                    previousStock: previousStockDec.toString(),
                    newStock: newStockDec.toString(),
                    referenceId: batch.productionOrderId || batch.id,
                    notes: `Liberación de lote de manufactura: ${batch.batchNumber}`,
                    createdBy: user.id
                });
            }
        });

        revalidatePath('/dashboard/manufacturing/quality-control');
        revalidatePath('/dashboard/manufacturing/orders');
        revalidatePath('/dashboard/manufacturing/raw-materials');
        revalidatePath('/dashboard/products');

        return { success: true, message: `Lote ${newStatus === 'AVAILABLE' ? 'aprobado' : 'rechazado'} exitosamente.` };
    } catch (error: any) {
        console.error("Error al procesar lote:", error);
        return { success: false, error: error.message || "Error al procesar el estado de calidad del lote." };
    }
}
