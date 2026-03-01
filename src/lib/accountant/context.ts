import { cookies } from "next/headers";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function getActiveOrgId(): Promise<string> {
    const cookieStore = await cookies();
    const activeOrgId = cookieStore.get("axioma_active_org")?.value;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("No autenticado");
    }

    if (activeOrgId) {
        // Check if the cookie's org_id is valid for the current user
        const membership = await db.query.memberships.findFirst({
            where: and(
                eq(memberships.userId, user.id),
                eq(memberships.organizationId, activeOrgId)
            )
        });

        if (membership) {
            return activeOrgId;
        }
    }

    // Fallback: query the database for the first organization where the user has a membership
    const firstMembership = await db.query.memberships.findFirst({
        where: eq(memberships.userId, user.id),
    });

    if (firstMembership?.organizationId) {
        return firstMembership.organizationId;
    }

    throw new Error("El usuario no pertenece a ninguna organización");
}

export async function validateAccountantAccess(orgId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        const error = new Error("No autenticado");
        (error as any).status = 401;
        throw error;
    }

    // User is considered 'admin' if app_metadata or user_metadata says so
    const isAdmin = user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin';

    // Verify if there is an active membership for this organization
    const membership = await db.query.memberships.findFirst({
        where: and(
            eq(memberships.userId, user.id),
            eq(memberships.organizationId, orgId)
        )
    });

    if (isAdmin || membership) {
        return true;
    }

    const error = new Error("Forbidden");
    (error as any).status = 403;
    (error as any).statusCode = 403;
    throw error;
}
