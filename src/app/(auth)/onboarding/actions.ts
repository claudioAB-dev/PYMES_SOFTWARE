'use server';

import { db } from "@/db";
import { organizations, memberships } from "@/db/schema";
import { createOrganizationSchema, type CreateOrganizationInput } from "@/lib/validators/onboarding";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function createOrganizationAction(input: CreateOrganizationInput) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No estás autenticado." };
    }

    const validation = createOrganizationSchema.safeParse(input);
    if (!validation.success) {
        return { error: "Datos inválidos.", details: validation.error.flatten() };
    }

    const { name, slug, rfc } = validation.data;

    try {
        await db.transaction(async (tx) => {
            // 1. Create Organization
            const [newOrg] = await tx.insert(organizations).values({
                name,
                slug,
                taxId: rfc || null, // Convert empty string to null if needed, though schema allows string
            }).returning({ id: organizations.id });

            if (!newOrg) throw new Error("Error al crear la organización.");

            // 2. Create Membership (Owner)
            await tx.insert(memberships).values({
                userId: user.id,
                organizationId: newOrg.id,
                role: 'OWNER',
            });
        });
    } catch (err: any) {
        // Build error message
        const message = err.message || "Error desconocido al crear la organización.";

        // Check for specific DB errors (e.g., unique constraint on slug/taxId if enforced)
        if (message.includes("violates unique constraint")) {
            if (message.includes("slug")) return { error: "Ese slug ya está en uso." };
            if (message.includes("tax_id")) return { error: "Ese RFC ya está registrado." };
        }

        return { error: message };
    }

    revalidatePath('/dashboard');
    redirect('/dashboard');
}
