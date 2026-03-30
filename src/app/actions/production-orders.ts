"use server";

import { db } from "@/db";
import { bomLines, productionOrders, productionOrderMaterials, memberships, products, inventoryMovements, productBatches } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { Decimal } from "decimal.js";
import { revalidatePath } from "next/cache";

async function getOrganizationId() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

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
        role: userMemberships[0].role,
        user
    };
}

export async function createProductionOrderAction(productId: string, targetQuantity: number, inputStartDate?: string) {
    try {
        const { organizationId } = await getOrganizationId();
        const startDate = inputStartDate ? new Date(inputStartDate) : new Date();

        // 2. Transacción para crear la orden y sus detalles
        const newOrderId = await db.transaction(async (tx: any) => {

            // Función recursiva para iterar en BOMs multinivel
            async function buildOrderRecursive(prodId: string, qty: number, parentId: string | null = null): Promise<string> {
                // Fetch the BOM for the given product, including product to check itemType
                const bom = await tx.query.bomLines.findMany({
                    where: eq(bomLines.parentProductId, prodId),
                    with: {
                        componentProduct: true
                    }
                });

                if (!bom || bom.length === 0) {
                    if (parentId === null) {
                        throw new Error("El producto principal no tiene una Lista de Materiales (BOM) configurada.");
                    } else {
                        // Si es un sub-ensamble pero no tiene BOM, podríamos fallar.
                        throw new Error("Un sub-ensamble requerido no tiene Lista de Materiales configurada.");
                    }
                }

                // Insert the header
                const [newOrder] = await tx.insert(productionOrders).values({
                    organizationId: organizationId,
                    productId: prodId,
                    parentOrderId: parentId, // Link self-referential
                    targetQuantity: qty.toString(), // Store as string for decimal
                    status: 'draft',
                    startDate: startDate,
                }).returning({ id: productionOrders.id });

                // Calculate and prepare the materials insertion
                const materialsToInsert: any[] = [];

                for (const line of bom) {
                    // Formula: (Cantidad en BOM * targetQuantity) * (1 + (scrap_factor / 100))
                    const bomQuantity = new Decimal(line.quantity as string);
                    const targetQtyDec = new Decimal(qty);
                    const scrapFactorDec = new Decimal(line.scrapFactor as string).dividedBy(100);

                    const plannedQtyDec = bomQuantity.mul(targetQtyDec).mul(new Decimal(1).plus(scrapFactorDec));

                    // Redondear a un número razonable de decimales (ej. 4)
                    const finalQuantity = plannedQtyDec.toDecimalPlaces(4).toString();

                    materialsToInsert.push({
                        productionOrderId: newOrder.id,
                        materialId: line.componentProductId,
                        plannedQuantity: finalQuantity,
                        actualQuantity: finalQuantity, // Default to planned
                        unitCost: line.unitCost as string, // Snapshot of the current cost from BOM
                    });

                    // Si el componente es a su vez un sub-ensamble, explota el BOM y crea orden hija
                    if (line.componentProduct?.itemType === 'sub_assembly') {
                        await buildOrderRecursive(line.componentProductId, plannedQtyDec.toNumber(), newOrder.id);
                    }
                }

                // Insert the materials for the current order
                if (materialsToInsert.length > 0) {
                    await tx.insert(productionOrderMaterials).values(materialsToInsert);
                }

                return newOrder.id;
            }

            return await buildOrderRecursive(productId, targetQuantity, null);
        });

        revalidatePath('/dashboard/manufacturing/orders');
        return { success: true, orderId: newOrderId };

    } catch (error: any) {
        console.error("Error creating production order:", error);
        return { success: false, error: error.message || "Error al crear la orden de producción." };
    }
}

export async function completeProductionOrderAction(
    orderId: string,
    actualQuantities: { materialId: string; quantity: string }[],
    batchData: { batchNumber: string; manufacturingDate: Date; expirationDate: Date | null }
) {
    try {
        const { organizationId, user } = await getOrganizationId();

        // Verify order exists and belongs to organization
        const order = await db.query.productionOrders.findFirst({
            where: and(
                eq(productionOrders.id, orderId),
                eq(productionOrders.organizationId, organizationId)
            ),
        });

        if (!order) {
            throw new Error("Orden de producción no encontrada o acceso denegado.");
        }

        if (order.status === 'completed' || order.status === 'cancelled') {
            throw new Error(`No se puede modificar una orden en estado ${order.status}.`);
        }

        // ==========================================
        // PRE-VALIDATION: Check Stock for Shortages
        // ==========================================
        const shortages: { materialName: string, requiredQty: string, currentStock: string, shortage: string }[] = [];

        // Fetch all required material records in one go
        const materialIds = actualQuantities.map(m => m.materialId);

        if (materialIds.length > 0) {
            // Using Drizzle's in operator via 'inArray'
            const { inArray } = await import("drizzle-orm");

            const materialsRecords = await db.query.products.findMany({
                where: inArray(products.id, materialIds),
                columns: { id: true, name: true, stock: true }
            });

            // Map records for quick lookup
            const stockMap = new Map(materialsRecords.map(m => [m.id, { name: m.name, stock: m.stock }]));

            for (const item of actualQuantities) {
                const record = stockMap.get(item.materialId);
                if (!record) {
                    throw new Error(`Insumo con ID ${item.materialId} no existe en inventario.`);
                }

                const requiredDec = new Decimal(item.quantity);
                const currentDec = new Decimal(record.stock as string);

                if (currentDec.lessThan(requiredDec)) {
                    shortages.push({
                        materialName: record.name,
                        requiredQty: requiredDec.toString(),
                        currentStock: currentDec.toString(),
                        shortage: requiredDec.minus(currentDec).toString()
                    });
                }
            }
        }

        // Early return if shortages exist
        if (shortages.length > 0) {
            return {
                success: false,
                errorType: 'INSUFFICIENT_STOCK',
                message: 'Inventario insuficiente para completar la orden',
                details: shortages
            };
        }

        // ==========================================
        // Batch Data
        // ==========================================
        const { batchNumber, manufacturingDate, expirationDate } = batchData;

        // ==========================================
        // TRANSACTION: Process inventory and complete
        // ==========================================
        await db.transaction(async (tx: any) => {
            // STEP 1: Update each material's actual quantity and decrease inventory
            for (const item of actualQuantities) {
                // Update production_order_materials
                await tx.update(productionOrderMaterials)
                    .set({ actualQuantity: item.quantity })
                    .where(
                        and(
                            eq(productionOrderMaterials.productionOrderId, orderId),
                            eq(productionOrderMaterials.materialId, item.materialId)
                        )
                    );

                // Fetch current product stock inside TX for safety
                const [productRecord] = await tx.select({ stock: products.stock })
                    .from(products)
                    .where(eq(products.id, item.materialId));

                if (!productRecord) {
                    throw new Error(`Insumo con ID ${item.materialId} no encontrado.`);
                }

                const previousStockDec = new Decimal(productRecord.stock as string);
                const consumedQtyDec = new Decimal(item.quantity);
                const newStockDec = previousStockDec.minus(consumedQtyDec);

                const previousStockStr = previousStockDec.toString();
                const newStockStr = newStockDec.toString();

                // Update product stock
                await tx.update(products)
                    .set({ stock: newStockStr })
                    .where(eq(products.id, item.materialId));

                // Insert inventory movement (OUT)
                await tx.insert(inventoryMovements).values({
                    organizationId,
                    productId: item.materialId,
                    type: 'ADJUSTMENT',
                    quantity: consumedQtyDec.toString(),
                    previousStock: previousStockStr,
                    newStock: newStockStr,
                    referenceId: orderId,
                    notes: `Consumo para Orden de Producción #${orderId.split('-')[0]}`,
                    createdBy: user.id
                });
            }

            // STEP 2: Create a Product Batch (Lote) instead of flat stock increment
            const manufacturedQtyStr = new Decimal(order.targetQuantity as string).toString();

            await tx.insert(productBatches).values({
                productId: order.productId,
                batchNumber: batchNumber,
                manufacturingDate: manufacturingDate,
                expirationDate: expirationDate,
                initialQuantity: manufacturedQtyStr,
                currentQuantity: manufacturedQtyStr,
                productionOrderId: orderId,
            });

            // STEP 3: Update order status to completed
            await tx.update(productionOrders)
                .set({
                    status: 'completed',
                    completionDate: new Date()
                })
                .where(eq(productionOrders.id, orderId));
        });

        revalidatePath('/dashboard/manufacturing/orders');
        revalidatePath(`/dashboard/manufacturing/orders/${orderId}`);
        revalidatePath('/dashboard/manufacturing/raw-materials');
        revalidatePath('/dashboard/products');

        return { success: true, message: "Orden completada exitosamente. Lote generado.", batchNumber };
    } catch (error: any) {
        console.error("Error completing production order:", error);
        return { success: false, error: error.message || "Error al completar la orden de producción." };
    }
}

export async function cancelProductionOrderAction(orderId: string) {
    try {
        const { organizationId } = await getOrganizationId();

        const order = await db.query.productionOrders.findFirst({
            where: and(
                eq(productionOrders.id, orderId),
                eq(productionOrders.organizationId, organizationId)
            ),
            columns: {
                id: true,
                status: true
            }
        });

        if (!order) {
            throw new Error("Orden de producción no encontrada o acceso denegado.");
        }

        if (order.status === 'completed') {
            throw new Error("No se puede cancelar una orden que ya reportó consumo físico");
        }

        await db.update(productionOrders)
            .set({ status: 'cancelled' })
            .where(
                and(
                    eq(productionOrders.id, orderId),
                    eq(productionOrders.organizationId, organizationId)
                )
            );

        revalidatePath('/dashboard/manufacturing/planner');
        revalidatePath('/dashboard/manufacturing/raw-materials');
        revalidatePath('/dashboard/manufacturing/orders');

        return { success: true, message: "Orden cancelada y materiales liberados" };
    } catch (error: any) {
        console.error("Error cancelling production order:", error);
        return { success: false, error: error.message || "Error al cancelar la orden de producción." };
    }
}
