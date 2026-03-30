"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { products, memberships, orders, productionOrders, productionOrderMaterials } from "@/db/schema";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { productSchema, ProductInput } from "@/lib/validators/products";
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

export async function getRawMaterials() {
    try {
        const { organizationId } = await getOrganizationId();

        const data = await db.query.products.findMany({
            where: and(
                eq(products.organizationId, organizationId),
                eq(products.archived, false),
                inArray(products.itemType, ['raw_material', 'sub_assembly'])
            ),
            orderBy: [desc(products.createdAt)],
        });

        const pendingPurchases = await db.query.orders.findMany({
            where: and(
                eq(orders.organizationId, organizationId),
                eq(orders.type, 'PURCHASE'),
                inArray(orders.status, ['DRAFT', 'CONFIRMED']),
            ),
            with: {
                items: true,
            }
        });

        // Query reserved stock
        const materialIds = data.map(p => p.id);
        const reservedMap = new Map<string, number>();

        if (materialIds.length > 0) {
            const reservedQuery = await db.select({
                materialId: productionOrderMaterials.materialId,
                totalReserved: sql<string>`sum(${productionOrderMaterials.plannedQuantity})`
            })
                .from(productionOrderMaterials)
                .innerJoin(productionOrders, eq(productionOrders.id, productionOrderMaterials.productionOrderId))
                .where(
                    and(
                        eq(productionOrders.organizationId, organizationId),
                        inArray(productionOrderMaterials.materialId, materialIds),
                        inArray(productionOrders.status, ['draft', 'in_progress'])
                    )
                )
                .groupBy(productionOrderMaterials.materialId);

            for (const row of reservedQuery) {
                reservedMap.set(row.materialId, Number(row.totalReserved || 0));
            }
        }

        return data.map(product => {
            let stockInTransit = 0;
            let nextDeliveryDate: Date | null = null;

            for (const order of pendingPurchases) {
                const hasProduct = order.items.find(item => item.productId === product.id);
                if (hasProduct) {
                    stockInTransit += Number(hasProduct.quantity);
                    if (order.expectedDeliveryDate) {
                        const deliveryDate = new Date(order.expectedDeliveryDate);
                        if (!nextDeliveryDate || deliveryDate < nextDeliveryDate) {
                            nextDeliveryDate = deliveryDate;
                        }
                    }
                }
            }

            const reservedStock = reservedMap.get(product.id) || 0;

            return {
                ...product,
                stockInTransit,
                nextDeliveryDate,
                reservedStock,
            };
        });
    } catch (error) {
        console.error("Error fetching raw materials:", error);
        return [];
    }
}

export async function createRawMaterial(input: ProductInput) {
    try {
        const { organizationId } = await getOrganizationId();

        const validatedFields = productSchema.safeParse(input);

        if (!validatedFields.success) {
            return { error: "Datos inválidos" };
        }

        const IVA_RATE = 1.16;
        const parsedPrice = parseFloat(validatedFields.data.price);
        const finalPrice = validatedFields.data.priceIncludesVat
            ? (parsedPrice / IVA_RATE)
            : parsedPrice;

        await db.insert(products).values({
            organizationId: organizationId,
            name: validatedFields.data.name,
            sku: validatedFields.data.sku || null,
            type: validatedFields.data.type,
            itemType: "raw_material", // Enforce raw_material
            price: finalPrice.toFixed(6),
            cost: validatedFields.data.cost.toString(),
            stock: validatedFields.data.stock?.toString() || "0",
            uom: "PZA", // Default
            isManufacturable: validatedFields.data.isManufacturable || false,
        });

        revalidatePath("/dashboard/manufacturing/raw-materials");
        return { success: true };
    } catch (error: any) {
        console.error(error);
        if (error.code === '23505') {
            return { error: "El SKU ya existe en esta organización" };
        }
        return { error: "Error al crear la materia prima" };
    }
}

export async function updateRawMaterial(id: string, input: ProductInput) {
    try {
        const { organizationId } = await getOrganizationId();

        const validatedFields = productSchema.safeParse(input);

        if (!validatedFields.success) {
            return { error: "Datos inválidos" };
        }

        const IVA_RATE = 1.16;
        const parsedPrice = parseFloat(validatedFields.data.price);
        const finalPrice = validatedFields.data.priceIncludesVat
            ? (parsedPrice / IVA_RATE)
            : parsedPrice;

        await db.update(products).set({
            name: validatedFields.data.name,
            sku: validatedFields.data.sku || null,
            type: validatedFields.data.type,
            price: finalPrice.toFixed(6),
            cost: validatedFields.data.cost.toString(),
            stock: validatedFields.data.stock?.toString() || "0",
            isManufacturable: validatedFields.data.isManufacturable || false,
        }).where(and(eq(products.id, id), eq(products.organizationId, organizationId)));

        revalidatePath("/dashboard/manufacturing/raw-materials");
        return { success: true };
    } catch (error: any) {
        console.error(error);
        if (error.code === '23505') {
            return { error: "El SKU ya existe en esta organización" };
        }
        return { error: "Error al actualizar la materia prima" };
    }
}
