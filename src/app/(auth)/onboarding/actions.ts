'use server';

import { db } from "@/db";
import { organizations, memberships } from "@/db/schema";
import { createOrganizationSchema, type CreateOrganizationInput } from "@/lib/validators/onboarding";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { verifyInviteToken } from "@/lib/auth/token";

// ─── Slugify helper ────────────────────────────────────────────────────────────
// Converts any company name into a URL-safe slug.
// Example: "Distribuidora León S.A. de C.V." → "distribuidora-leon-sa-de-cv"
function slugify(text: string): string {
    return text
        .normalize("NFD")                          // decompose accented chars (é → e +  ́)
        .replace(/[\u0300-\u036f]/g, "")           // strip diacritic marks
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")             // remove remaining special chars
        .replace(/[\s_]+/g, "-")                   // spaces/underscores → hyphens
        .replace(/-{2,}/g, "-")                    // collapse multiple hyphens
        .replace(/^-+|-+$/g, "");                  // trim leading/trailing hyphens
}

// Generates a random 4-char alphanumeric suffix for slug collision handling
function randomSuffix(): string {
    return Math.random().toString(36).slice(2, 6);
}

// Finds a unique slug, appending a suffix if the base slug is already taken
async function findUniqueSlug(base: string): Promise<string> {
    const exists = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.slug, base))
        .limit(1);

    if (exists.length === 0) return base;

    // Try up to 5 suffixed variants before giving up
    for (let i = 0; i < 5; i++) {
        const candidate = `${base}-${randomSuffix()}`;
        const conflict = await db
            .select({ id: organizations.id })
            .from(organizations)
            .where(eq(organizations.slug, candidate))
            .limit(1);
        if (conflict.length === 0) return candidate;
    }

    // Fallback: timestamp-based suffix (practically guaranteed unique)
    return `${base}-${Date.now().toString(36)}`;
}

// ─── Main action ───────────────────────────────────────────────────────────────
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

    const { name, rfc } = validation.data;

    // Auto-generate a unique slug from the company name
    const baseSlug = slugify(name) || `org-${randomSuffix()}`;
    const slug = await findUniqueSlug(baseSlug);

    // 3. Reverse Invitation Check
    const cookieStore = await cookies();
    const refTokenCookie = cookieStore.get('axioma_ref_token')?.value;
    let accountantIdToLink: string | null = null;

    if (refTokenCookie) {
        accountantIdToLink = verifyInviteToken(refTokenCookie);
    } else if (user.user_metadata?.invited_by_ref) {
        accountantIdToLink = user.user_metadata.invited_by_ref;
    }

    const trialDays = 15;
    const currentPeriodEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

    try {
        await db.transaction(async (tx) => {
            // 1. Create Organization with 15-day trial
            const [newOrg] = await tx
                .insert(organizations)
                .values({
                    name,
                    slug,
                    taxId: rfc || null,
                    plan: 'pro',
                    subscriptionStatus: 'trialing',
                    currentPeriodEnd: currentPeriodEnd,
                })
                .returning({ id: organizations.id });

            if (!newOrg) throw new Error("Error al crear la organización.");

            // 2. Create Membership (Owner)
            await tx.insert(memberships).values({
                userId: user.id,
                organizationId: newOrg.id,
                role: "OWNER",
            });

            // 3. Create Membership (Accountant) if reverse invite exists
            if (accountantIdToLink) {
                try {
                    await tx.insert(memberships).values({
                        userId: accountantIdToLink,
                        organizationId: newOrg.id,
                        role: "ACCOUNTANT",
                    });
                    // Clear the cookie so it doesn't get applied strictly randomly later
                    if (refTokenCookie) {
                        cookieStore.delete('axioma_ref_token');
                    }
                } catch (inviteErr) {
                    console.error("Error silencioso al vincular al contador:", inviteErr);
                }
            }
        });
    } catch (err: unknown) {
        const message =
            err instanceof Error ? err.message : "Error desconocido al crear la organización.";

        if (message.includes("violates unique constraint")) {
            if (message.includes("tax_id")) return { error: "Ese RFC ya está registrado en otra organización." };
        }

        return { error: message };
    }

    revalidatePath('/dashboard');
    redirect('/dashboard');
}
