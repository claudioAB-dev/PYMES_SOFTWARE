"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { entities, memberships } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createEntitySchema, CreateEntityInput } from "@/lib/validators/entities";
import { revalidatePath } from "next/cache";

export async function getEntities() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Get user's organization
    // In a real multi-tenant app, we might need to pass orgId context or handle switching
    // For now, we take the first one as per spec
    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) {
        return [];
    }

    const organizationId = userMemberships[0].organizationId;

    const data = await db.query.entities.findMany({
        where: eq(entities.organizationId, organizationId),
        orderBy: [desc(entities.createdAt)],
    });

    return data;
}

export async function createEntity(input: CreateEntityInput) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("createEntity: Unauthorized - No user found");
        return { error: "Unauthorized" };
    }

    // Validate input
    const validatedFields = createEntitySchema.safeParse(input);

    if (!validatedFields.success) {
        console.error("createEntity: Validation failed", validatedFields.error);
        return { error: "Invalid fields: " + validatedFields.error.errors.map(e => e.message).join(", ") };
    }

    // Get user's organization - SECURITY CHECK
    try {
        const userMemberships = await db.query.memberships.findMany({
            where: eq(memberships.userId, user.id),
        });

        if (userMemberships.length === 0) {
            console.error("createEntity: No organization found for user", user.id);
            return { error: "No organization found" };
        }

        const organizationId = userMemberships[0].organizationId;
        console.log("createEntity: Creating entity for org", organizationId);

        await db.insert(entities).values({
            organizationId: organizationId,
            type: validatedFields.data.type,
            commercialName: validatedFields.data.name,
            legalName: validatedFields.data.commercialName,
            taxId: validatedFields.data.rfc?.toUpperCase(),
            postalCode: null,
        });

        revalidatePath("/dashboard/entities");
        console.log("createEntity: Success");
        return { success: true };
    } catch (error) {
        console.error("createEntity: Database/System Error:", error);
        // Check for specific DB errors if possible (e.g., unique constraint)
        return { error: "Failed to create entity. See server logs for details." };
    }
}
