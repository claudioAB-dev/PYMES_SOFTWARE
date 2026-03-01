'use server';

import { createClient } from "@/lib/supabase/server";
import { signInviteToken } from "@/lib/auth/token";

export async function generateClientInviteLink() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No estás autenticado." };
    }

    if (!user.user_metadata?.is_accountant) {
        return { error: "Acceso denegado. Solo los contadores pueden generar enlaces de invitación para clientes." };
    }

    // Generate a secure HMAC signed token with the accountant's user ID
    const token = signInviteToken(user.id);

    // Build absolute URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/register?ref=${token}`;

    return { success: true, url: inviteUrl };
}

import { db } from "@/db";
import { memberships } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setActiveOrganization(organizationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("No estás autenticado.");
    }

    // Verify accountant membership in the database
    const membership = await db.query.memberships.findFirst({
        where: and(
            eq(memberships.userId, user.id),
            eq(memberships.organizationId, organizationId),
            eq(memberships.role, 'ACCOUNTANT')
        )
    });

    if (!membership) {
        throw new Error("No tienes acceso a esta empresa como contador.");
    }

    const cookieStore = await cookies();

    // Set cookie to expire in 7 days
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    cookieStore.set('axioma_active_org', organizationId, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });

    revalidatePath('/accountant', 'layout');
}
