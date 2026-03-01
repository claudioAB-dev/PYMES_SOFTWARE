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

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setActiveOrganization(organizationId: string) {
    const cookieStore = await cookies();

    // Set cookie to expire in 30 days
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    cookieStore.set('axioma_active_org', organizationId, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });

    revalidatePath('/', 'layout');
}
