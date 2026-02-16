"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { products, memberships } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
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

    return { organizationId: userMemberships[0].organizationId, user };
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
        const { organizationId } = await getOrganizationId();

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
