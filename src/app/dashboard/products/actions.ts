"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { products, memberships, inventoryMovements } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
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

    // TODO: Fix this to select the *active* organization properly.
    // For now, selecting the first one as per existing pattern.
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

export async function getProducts() {
    try {
        const { organizationId } = await getOrganizationId();

        const data = await db.query.products.findMany({
            where: and(
                eq(products.organizationId, organizationId),
                eq(products.archived, false)
            ),
            orderBy: [desc(products.createdAt)],
        });

        return data;
    } catch (error) {
        return [];
    }
}

export async function createProduct(input: ProductInput) {
    try {
        const { organizationId } = await getOrganizationId();

        const validatedFields = productSchema.safeParse(input);

        if (!validatedFields.success) {
            return { error: "Datos inválidos" };
        }

        await db.insert(products).values({
            organizationId: organizationId,
            name: validatedFields.data.name,
            sku: validatedFields.data.sku || null,
            type: validatedFields.data.type,
            price: validatedFields.data.price,
            stock: validatedFields.data.stock?.toString() || "0",
            uom: "PZA", // Default
        });

        revalidatePath("/dashboard/products");
        return { success: true };
    } catch (error: any) {
        console.error(error);
        if (error.code === '23505') { // Postgres unique constraint error code
            return { error: "El SKU ya existe en esta organización" };
        }
        return { error: "Error al crear el producto" };
    }
}

export async function archiveProduct(productId: string) {
    try {
        const { organizationId, role } = await getOrganizationId();

        // Only ADMIN and OWNER can archive/delete products
        if (role !== 'OWNER' && role !== 'ADMIN') {
            return { error: "Solo administradores pueden eliminar productos" };
        }

        // Soft delete: set archived = true
        await db
            .update(products)
            .set({ archived: true })
            .where(and(eq(products.id, productId), eq(products.organizationId, organizationId)));

        revalidatePath("/dashboard/products");
        return { success: true };
    } catch (error: any) {
        console.error(error);
        return { error: "Error al archivar el producto" };
    }
}

export async function updateProduct(productId: string, input: Partial<ProductInput>) {
    // Optional for now, but good to have skeleton
    try {
        const { organizationId } = await getOrganizationId();

        // Validation logic here if needed for partial updates

        await db
            .update(products)
            .set({
                // ... map fields
                // updated_at: new Date(),
            })
            .where(and(eq(products.id, productId), eq(products.organizationId, organizationId)));

        revalidatePath("/dashboard/products");
        return { success: true };

    } catch (error) {
        console.error(error);
        return { error: "Error al actualizar" };
    }
}

export async function adjustInventory(productId: string, newQuantity: number, notes?: string) {
    try {
        const { organizationId, role, user } = await getOrganizationId();

        if (role !== 'OWNER' && role !== 'ADMIN') {
            return { error: "No tienes permisos suficientes. Solo administradores pueden ajustar el inventario." };
        }

        if (newQuantity < 0) {
            return { error: "El inventario no puede ser negativo." };
        }

        let success = false;
        await db.transaction(async (tx) => {
            const product = await tx.query.products.findFirst({
                where: and(eq(products.id, productId), eq(products.organizationId, organizationId)),
            });

            if (!product) throw new Error("Producto no encontrado");

            const previousStockNum = Number(product.stock);
            if (previousStockNum === newQuantity) {
                throw new Error("La nueva cantidad es igual a la actual.");
            }

            const difference = newQuantity - previousStockNum; // Can be negative or positive

            await tx.update(products)
                .set({ stock: newQuantity.toString() })
                .where(eq(products.id, productId));

            await tx.insert(inventoryMovements).values({
                organizationId,
                productId,
                type: 'ADJUSTMENT',
                quantity: difference.toString(),
                previousStock: previousStockNum.toString(),
                newStock: newQuantity.toString(),
                notes: notes || "Ajuste manual",
                createdBy: user.id
            });
            success = true;
        });

        if (success) {
            revalidatePath(`/dashboard/products/${productId}`);
            revalidatePath("/dashboard/products");
            return { success: true };
        }
        return { error: "No se pudo realizar el ajuste." };

    } catch (error: any) {
        console.error("Error adjusting inventory:", error);
        return { error: error.message || "Error al ajustar inventario" };
    }
}

export async function getProductMovements(productId: string) {
    try {
        const { organizationId } = await getOrganizationId();

        const movements = await db.query.inventoryMovements.findMany({
            where: and(
                eq(inventoryMovements.productId, productId),
                eq(inventoryMovements.organizationId, organizationId)
            ),
            with: {
                user: {
                    columns: {
                        fullName: true,
                        email: true
                    }
                }
            },
            orderBy: [desc(inventoryMovements.createdAt)],
        });

        return movements;
    } catch (error) {
        console.error("Error fetching product movements:", error);
        return [];
    }
}

