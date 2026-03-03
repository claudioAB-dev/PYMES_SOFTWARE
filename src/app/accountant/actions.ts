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
import { memberships, organizations, invitations } from "@/db/schema";
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

import { fiscalDocuments } from "@/db/schema";
import { sql } from "drizzle-orm";
import { validateAccountantAccess } from "@/lib/accountant/context";

export async function exportInvoicesToCsv(orgId: string, filters: { month: number, year: number }) {
    // 1. Verify access
    await validateAccountantAccess(orgId);

    // 2. Calculate boundaries
    const startOfMonth = new Date(filters.year, filters.month - 1, 1).toISOString();
    const endOfMonth = new Date(filters.year, filters.month, 0, 23, 59, 59).toISOString();

    // 3. Fetch documents
    const documents = await db.query.fiscalDocuments.findMany({
        where: and(
            eq(fiscalDocuments.organizationId, orgId),
            sql`${fiscalDocuments.issueDate} >= ${startOfMonth}`,
            sql`${fiscalDocuments.issueDate} <= ${endOfMonth}`
        ),
        orderBy: (fiscalDocuments, { asc }) => [asc(fiscalDocuments.issueDate)]
    });

    // 4. Generate CSV
    const headers = ["Fecha", "UUID", "RFC Emisor", "Nombre Emisor", "RFC Receptor", "Subtotal", "IVA", "Total", "Estatus"];

    const rows = documents.map(doc => {
        const fecha = doc.issueDate ? new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(doc.issueDate) : "";
        const uuid = doc.uuid || "";
        const rfcEmisor = doc.issuerRfc || "";
        const nombreEmisor = ""; // Schema doesn't currently store issuer name
        const rfcReceptor = doc.receiverRfc || "";
        const subtotal = doc.subtotal ? doc.subtotal.toString() : "0";
        const iva = doc.tax ? doc.tax.toString() : "0";
        const total = doc.total ? doc.total.toString() : "0";
        const estatus = "Sincronizado";

        // Escape fields to prevent CSV injection and handle commas/quotes
        return [fecha, uuid, rfcEmisor, nombreEmisor, rfcReceptor, subtotal, iva, total, estatus]
            .map(field => `"${String(field).replace(/"/g, '""')}"`)
            .join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    return { success: true, csv: csvContent };
}

// ─── Slugify helper ────────────────────────────────────────────────────────────
function slugify(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, "");
}

function randomSuffix(): string {
    return Math.random().toString(36).slice(2, 6);
}

async function findUniqueSlug(base: string): Promise<string> {
    const exists = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.slug, base))
        .limit(1);

    if (exists.length === 0) return base;

    for (let i = 0; i < 5; i++) {
        const candidate = `${base}-${randomSuffix()}`;
        const conflict = await db
            .select({ id: organizations.id })
            .from(organizations)
            .where(eq(organizations.slug, candidate))
            .limit(1);
        if (conflict.length === 0) return candidate;
    }
    return `${base}-${Date.now().toString(36)}`;
}

export async function inviteClient(data: { companyName: string, email: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.user_metadata?.is_accountant) {
        return { error: "No autorizado." };
    }

    const { companyName, email } = data;
    if (!companyName || !email) return { error: "Faltan datos." };

    const baseSlug = slugify(companyName) || `org-${randomSuffix()}`;
    const slug = await findUniqueSlug(baseSlug);

    try {
        const result = await db.transaction(async (tx) => {
            // 1. Create Organization
            const [newOrg] = await tx
                .insert(organizations)
                .values({ name: companyName, slug })
                .returning({ id: organizations.id });

            if (!newOrg) throw new Error("Error al crear la organización.");

            // 2. Create Membership (Accountant)
            await tx.insert(memberships).values({
                userId: user.id,
                organizationId: newOrg.id,
                role: "ACCOUNTANT",
            });

            // 3. Create Pending Invitation for the client
            const token = crypto.randomUUID();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            const [invitation] = await tx.insert(invitations).values({
                email: email.toLowerCase(),
                role: "OWNER",
                token,
                organizationId: newOrg.id,
                invitedBy: user.id,
                expiresAt,
                status: "PENDING",
            }).returning();

            return { orgId: newOrg.id, token: invitation.token };
        });

        revalidatePath('/accountant/organizations');

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const inviteUrl = `${appUrl}/invite?token=${result.token}`;

        return { success: true, url: inviteUrl };
    } catch (error) {
        console.error("Error en inviteClient:", error);
        return { error: "Hubo un problema al invitar al cliente." };
    }
}

export async function cancelClientInvite(invitationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.user_metadata?.is_accountant) {
        return { error: "No autorizado." };
    }

    try {
        const invite = await db.query.invitations.findFirst({
            where: and(
                eq(invitations.id, invitationId),
                eq(invitations.invitedBy, user.id)
            )
        });

        if (!invite) return { error: "Invitación no encontrada." };

        await db.update(invitations)
            .set({ status: 'REVOKED' })
            .where(and(eq(invitations.id, invitationId), eq(invitations.invitedBy, user.id)));

        revalidatePath('/accountant/organizations');
        return { success: true };
    } catch (e) {
        return { error: "Error al cancelar la invitación." };
    }
}

export async function resendClientInvite(invitationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.user_metadata?.is_accountant) {
        return { error: "No autorizado." };
    }

    try {
        const invite = await db.query.invitations.findFirst({
            where: and(
                eq(invitations.id, invitationId),
                eq(invitations.invitedBy, user.id),
                eq(invitations.status, 'PENDING')
            )
        });

        if (!invite) return { error: "Invitación no encontrada o no está pendiente." };

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const inviteUrl = `${appUrl}/invite?token=${invite.token}`;

        return { success: true, url: inviteUrl };
    } catch (e) {
        return { error: "Error al reenviar la invitación." };
    }
}
