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
        return { error: "Unauthorized" };
    }

    // Validate input
    const validatedFields = createEntitySchema.safeParse(input);

    if (!validatedFields.success) {
        return { error: "Invalid fields" };
    }

    // Get user's organization - SECURITY CHECK
    // We re-fetch this on the server to ensure the user actually belongs to the org
    // We do NOT trust any org ID coming from the client if it was passed
    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) {
        return { error: "No organization found" };
    }

    const organizationId = userMemberships[0].organizationId;

    try {
        await db.insert(entities).values({
            organizationId: organizationId,
            type: validatedFields.data.type,
            // Use commercial name as name if not provided (though schema requires name)
            // Actually schema requires name, we mapped 'name' to 'commercialName' in UI or just use 'name'
            // Note: Schema has 'commercialName' as NOT NULL, 'legalName' as nullable
            // But Zod has 'name' and 'commercialName'.
            // Let's map Zod 'name' to 'commercialName' for now as it's the required field in DB
            commercialName: validatedFields.data.name,
            legalName: validatedFields.data.commercialName, // logic twist: UI 'name' -> DB 'commercial_name' (display name)
            taxId: validatedFields.data.rfc,
            // email is not in the schema I saw earlier! 
            // Checking schema.ts: 40: Entities (Clients/Suppliers) ... taxId, postalCode... NO EMAIL.
            // Wait, user request said: "Columnas: Nombre, RFC, Tipo (Cliente/Proveedor), Email."
            // BUT schema.ts provided in context DOES NOT have email.
            // I should probably add email to schema or ignore it.
            // Given I cannot edit schema migrations easily without potential issues in this environment if I don't have the CLI fully working or if I want to avoid schema changes if possible:
            // Actually, standard entity tables usually have email.
            // Let's check schema.ts again.
            // lines 41-50: commercialName, legalName, taxId, postalCode. NO EMAIL.
            // I will proceed WITHOUT email in DB for now to avoid migration hassle unless I'm sure.
            // OR I can add it. 
            // The user said "La tabla entities ya existe en el schema, úsala."
            // But also "Columnas: ... Email".
            // I will IGNORE email for persistence for now or store it if I can.
            // Actually, I'll check if I can add a migration.
            // Better: I will implement it without email in DB persistence for now to stick to "Use existing schema" constraint,
            // OR I will assume the user made a mistake in the request vs schema.
            // I will stick to schema. I won't save email.
        });

        revalidatePath("/dashboard/entities");
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Failed to create entity" };
    }
}
