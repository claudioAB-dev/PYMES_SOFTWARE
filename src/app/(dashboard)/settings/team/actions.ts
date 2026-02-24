'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { invitations, memberships, users } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import {
    inviteUserSchema,
    removeMemberSchema,
    revokeInvitationSchema,
    acceptInvitationSchema,
    type InviteUserInput,
} from '@/lib/validators/team'

// Helper: Get current user's membership
async function getCurrentUserMembership(organizationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const membership = await db.query.memberships.findFirst({
        where: and(
            eq(memberships.userId, user.id),
            eq(memberships.organizationId, organizationId)
        )
    })

    return { user, membership }
}

// Get team data (members + pending invitations)
export async function getTeamData(organizationId: string) {
    const result = await getCurrentUserMembership(organizationId)

    if (!result || !result.membership) {
        return { error: 'No autorizado' }
    }

    try {
        // Get all members with user details
        const members = await db.query.memberships.findMany({
            where: eq(memberships.organizationId, organizationId),
            with: {
                user: true
            },
            orderBy: (memberships, { asc }) => [asc(memberships.createdAt)]
        })

        // Get pending invitations
        const pendingInvitations = await db.query.invitations.findMany({
            where: and(
                eq(invitations.organizationId, organizationId),
                eq(invitations.status, 'PENDING')
            ),
            with: {
                inviter: true
            },
            orderBy: (invitations, { desc }) => [desc(invitations.createdAt)]
        })

        return {
            success: true,
            members,
            invitations: pendingInvitations,
            currentUserRole: result.membership.role
        }
    } catch (error) {
        console.error('Error fetching team data:', error)
        return { error: 'Error al cargar datos del equipo' }
    }
}

// Invite user
export async function inviteUser(input: InviteUserInput, organizationId: string) {
    const result = await getCurrentUserMembership(organizationId)

    if (!result || !result.membership) {
        return { error: 'No autorizado' }
    }

    const { membership, user: currentUser } = result

    // Check permissions: only ADMIN or OWNER can invite
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
        return { error: 'Solo administradores pueden invitar usuarios' }
    }

    // Validate input
    const validation = inviteUserSchema.safeParse(input)
    if (!validation.success) {
        return { error: validation.error.errors[0].message }
    }

    const { email, role } = validation.data

    // Prevent role escalation: ADMIN can't invite ADMIN unless they're OWNER
    if (role === 'ADMIN' && membership.role !== 'OWNER') {
        return { error: 'Solo el propietario puede invitar administradores' }
    }

    try {
        // Check if user is already a member
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email.toLowerCase())
        })

        if (existingUser) {
            const existingMembership = await db.query.memberships.findFirst({
                where: and(
                    eq(memberships.userId, existingUser.id),
                    eq(memberships.organizationId, organizationId)
                )
            })

            if (existingMembership) {
                return { error: 'Este usuario ya es miembro de la organización' }
            }
        }

        // Check for pending invitation
        const existingInvitation = await db.query.invitations.findFirst({
            where: and(
                eq(invitations.email, email.toLowerCase()),
                eq(invitations.organizationId, organizationId),
                eq(invitations.status, 'PENDING')
            )
        })

        if (existingInvitation) {
            return { error: 'Ya existe una invitación pendiente para este correo' }
        }

        // Generate secure token
        const token = randomBytes(32).toString('hex')

        // Set expiration (7 days from now)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        // Create invitation
        const [invitation] = await db.insert(invitations).values({
            email: email.toLowerCase(),
            role,
            token,
            organizationId,
            invitedBy: currentUser.id,
            expiresAt,
            status: 'PENDING',
        }).returning()

        revalidatePath('/dashboard/settings')

        // Return invitation link for manual sharing
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite?token=${token}`

        return {
            success: true,
            inviteLink,
            invitation: {
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                expiresAt: invitation.expiresAt
            }
        }
    } catch (error) {
        console.error('Error creating invitation:', error)
        return { error: 'Error al crear la invitación' }
    }
}

// Remove member
export async function removeMember(memberId: string, organizationId: string) {
    const result = await getCurrentUserMembership(organizationId)

    if (!result || !result.membership) {
        return { error: 'No autorizado' }
    }

    const { membership: currentUserMembership, user: currentUser } = result

    // Check permissions
    if (currentUserMembership.role !== 'OWNER' && currentUserMembership.role !== 'ADMIN') {
        return { error: 'Solo administradores pueden eliminar miembros' }
    }

    // Validate input
    const validation = removeMemberSchema.safeParse({ memberId })
    if (!validation.success) {
        return { error: validation.error.errors[0].message }
    }

    try {
        // Get target membership
        const targetMembership = await db.query.memberships.findFirst({
            where: and(
                eq(memberships.id, memberId),
                eq(memberships.organizationId, organizationId)
            )
        })

        if (!targetMembership) {
            return { error: 'Miembro no encontrado' }
        }

        // Prevent removing the last OWNER
        if (targetMembership.role === 'OWNER') {
            const ownerCount = await db.query.memberships.findMany({
                where: and(
                    eq(memberships.organizationId, organizationId),
                    eq(memberships.role, 'OWNER')
                )
            })

            if (ownerCount.length <= 1) {
                return { error: 'No puedes eliminar al único propietario de la organización' }
            }
        }

        // ADMIN can't remove OWNER
        if (currentUserMembership.role === 'ADMIN' && targetMembership.role === 'OWNER') {
            return { error: 'Los administradores no pueden eliminar al propietario' }
        }

        // Prevent self-removal if only OWNER
        if (targetMembership.userId === currentUser.id && targetMembership.role === 'OWNER') {
            const ownerCount = await db.query.memberships.findMany({
                where: and(
                    eq(memberships.organizationId, organizationId),
                    eq(memberships.role, 'OWNER')
                )
            })

            if (ownerCount.length <= 1) {
                return { error: 'No puedes eliminarte como el único propietario' }
            }
        }

        // Delete membership
        await db.delete(memberships).where(eq(memberships.id, memberId))

        revalidatePath('/dashboard/settings')

        return { success: true }
    } catch (error) {
        console.error('Error removing member:', error)
        return { error: 'Error al eliminar miembro' }
    }
}

// Revoke invitation
export async function revokeInvitation(invitationId: string, organizationId: string) {
    const result = await getCurrentUserMembership(organizationId)

    if (!result || !result.membership) {
        return { error: 'No autorizado' }
    }

    const { membership } = result

    // Check permissions
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
        return { error: 'Solo administradores pueden revocar invitaciones' }
    }

    // Validate input
    const validation = revokeInvitationSchema.safeParse({ invitationId })
    if (!validation.success) {
        return { error: validation.error.errors[0].message }
    }

    try {
        // Update invitation status
        const [updated] = await db.update(invitations)
            .set({ status: 'REVOKED' })
            .where(and(
                eq(invitations.id, invitationId),
                eq(invitations.organizationId, organizationId)
            ))
            .returning()

        if (!updated) {
            return { error: 'Invitación no encontrada' }
        }

        revalidatePath('/dashboard/settings')

        return { success: true }
    } catch (error) {
        console.error('Error revoking invitation:', error)
        return { error: 'Error al revocar invitación' }
    }
}

// Accept invitation
export async function acceptInvitation(token: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Debes iniciar sesión para aceptar la invitación' }
    }

    // Validate input
    const validation = acceptInvitationSchema.safeParse({ token })
    if (!validation.success) {
        return { error: validation.error.errors[0].message }
    }

    try {
        // Find invitation
        const invitation = await db.query.invitations.findFirst({
            where: eq(invitations.token, token)
        })

        if (!invitation) {
            return { error: 'Invitación no encontrada' }
        }

        // Check status
        if (invitation.status !== 'PENDING') {
            return { error: 'Esta invitación ya no es válida' }
        }

        // Check expiration
        if (new Date() > new Date(invitation.expiresAt)) {
            // Mark as expired
            await db.update(invitations)
                .set({ status: 'EXPIRED' })
                .where(eq(invitations.id, invitation.id))

            return { error: 'Esta invitación ha expirado' }
        }

        // Verify email matches (case-insensitive)
        if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
            return { error: 'Esta invitación es para otro correo electrónico' }
        }

        // Check if already a member
        const existingMembership = await db.query.memberships.findFirst({
            where: and(
                eq(memberships.userId, user.id),
                eq(memberships.organizationId, invitation.organizationId)
            )
        })

        if (existingMembership) {
            return { error: 'Ya eres miembro de esta organización' }
        }

        // Use transaction to create membership and update invitation
        await db.transaction(async (tx) => {
            // Create membership
            await tx.insert(memberships).values({
                userId: user.id,
                organizationId: invitation.organizationId,
                role: invitation.role,
            })

            // Mark invitation as accepted
            await tx.update(invitations)
                .set({ status: 'ACCEPTED' })
                .where(eq(invitations.id, invitation.id))
        })

        revalidatePath('/dashboard')

        return {
            success: true,
            organizationId: invitation.organizationId
        }
    } catch (error) {
        console.error('Error accepting invitation:', error)
        return { error: 'Error al aceptar la invitación' }
    }
}
