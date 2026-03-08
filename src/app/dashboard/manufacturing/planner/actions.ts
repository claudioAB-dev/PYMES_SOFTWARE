"use server";

import { db } from "@/db";
import { bomLines, orderItems, productionOrders, productionOrderMaterials, orders } from "@/db/schema";
import { eq, inArray, and, sql } from "drizzle-orm";
import { Decimal } from "decimal.js";

interface CapacityResult {
    maxProducible: number;
    bottleneckMaterial: string;
    status: 'ready' | 'delayed' | 'blocked';
    availableDate: Date | null;
    reservedStock?: number;
}

export async function calculateProductionCapacity(productId: string): Promise<CapacityResult> {
    try {
        const bom = await db.query.bomLines.findMany({
            where: eq(bomLines.parentProductId, productId),
            with: {
                componentProduct: true,
            }
        });

        if (!bom || bom.length === 0) {
            return {
                maxProducible: 0,
                bottleneckMaterial: "Sin lista de materiales",
                status: 'blocked',
                availableDate: null,
            };
        }

        const componentIds = bom.map(b => b.componentProduct.id);

        const transitQuery = await db.select({
            productId: orderItems.productId,
            totalTransit: sql<string>`sum(${orderItems.quantity})`,
            minDeliveryDate: sql<string>`min(${orders.expectedDeliveryDate})`
        })
            .from(orderItems)
            .innerJoin(orders, eq(orders.id, orderItems.orderId))
            .where(
                and(
                    inArray(orderItems.productId, componentIds),
                    eq(orders.type, 'PURCHASE'),
                    inArray(orders.status, ['DRAFT', 'CONFIRMED'])
                )
            )
            .groupBy(orderItems.productId);

        const transitMap = new Map<string, { transit: Decimal, availableDate: Date | null }>();
        for (const row of transitQuery) {
            transitMap.set(row.productId, {
                transit: new Decimal(row.totalTransit || "0"),
                availableDate: row.minDeliveryDate ? new Date(row.minDeliveryDate) : null
            });
        }

        const reservedQuery = await db.select({
            materialId: productionOrderMaterials.materialId,
            totalReserved: sql<string>`sum(${productionOrderMaterials.plannedQuantity})`
        })
            .from(productionOrderMaterials)
            .innerJoin(productionOrders, eq(productionOrders.id, productionOrderMaterials.productionOrderId))
            .where(
                and(
                    inArray(productionOrderMaterials.materialId, componentIds),
                    inArray(productionOrders.status, ['draft', 'in_progress'])
                )
            )
            .groupBy(productionOrderMaterials.materialId);

        const reservedMap = new Map<string, Decimal>();
        for (const row of reservedQuery) {
            reservedMap.set(row.materialId, new Decimal(row.totalReserved || "0"));
        }

        let maxProducible = Infinity;
        let bottleneckMaterial = "";
        let bottleneckReserved = 0;
        let bottleneckAvailableDate: Date | null = null;
        let bottleneckIsDelayed = false;

        for (const item of bom) {
            const stockActual = new Decimal((item.componentProduct.stock as string) || "0");
            const cantidadEnBOM = new Decimal((item.quantity as string) || "0");
            const scrapFactor = new Decimal((item.scrapFactor as string) || "0");

            const transitData = transitMap.get(item.componentProduct.id);
            const stockInTransit = transitData?.transit || new Decimal(0);
            const stockReserved = reservedMap.get(item.componentProduct.id) || new Decimal(0);

            let netInventory = stockActual.plus(stockInTransit).minus(stockReserved);
            if (netInventory.isNegative()) netInventory = new Decimal(0);

            // Capacidad del Insumo = Neto / (Cantidad en BOM * (1 + (scrap_factor / 100)))
            const multiplier = new Decimal(1).plus(scrapFactor.dividedBy(100));
            const requiredPerUnit = cantidadEnBOM.times(multiplier);

            if (requiredPerUnit.isZero()) continue;

            const capacidadInsumo = netInventory.dividedBy(requiredPerUnit).floor();
            const capacidadNum = capacidadInsumo.toNumber();

            if (capacidadNum < maxProducible) {
                maxProducible = capacidadNum;
                bottleneckMaterial = item.componentProduct.name;
                bottleneckReserved = stockReserved.toNumber();

                let stockSinTransito = stockActual.minus(stockReserved);
                if (stockSinTransito.isNegative()) stockSinTransito = new Decimal(0);

                const capacityWithoutTransit = stockSinTransito.dividedBy(requiredPerUnit).floor().toNumber();

                if (capacidadNum > 0 && capacidadNum > capacityWithoutTransit) {
                    bottleneckAvailableDate = transitData?.availableDate || null;
                    bottleneckIsDelayed = true;
                } else {
                    bottleneckAvailableDate = null;
                    bottleneckIsDelayed = false;
                }
            }
        }

        if (maxProducible === Infinity) {
            return {
                maxProducible: 0,
                bottleneckMaterial: "No se pudo calcular",
                status: 'blocked',
                availableDate: null,
                reservedStock: 0,
            };
        }

        return {
            maxProducible,
            bottleneckMaterial,
            status: maxProducible === 0 ? 'blocked' : (bottleneckIsDelayed ? 'delayed' : 'ready'),
            availableDate: bottleneckAvailableDate,
            reservedStock: bottleneckReserved,
        };

    } catch (error) {
        console.error("Error calculating production capacity:", error);
        throw new Error("Failed to calculate production capacity");
    }
}
