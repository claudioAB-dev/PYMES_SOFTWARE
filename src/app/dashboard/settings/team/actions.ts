'use server'

import { createClient } from '@/lib/supabase/server'
import { getAdminAuthClient } from '@/lib/supabase/admin'
import { db } from '@/db'
import { invitations, memberships, users, customRoles } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { logAuditTransaction } from '@/lib/audit/logger'
import {
    inviteUserSchema,
    removeMemberSchema,
    revokeInvitationSchema,
    acceptInvitationSchema,
    insertCustomRoleSchema,
    updateCustomRoleSchema,
    type InviteUserInput,
    type AcceptInvitationInput,
    type InsertCustomRoleInput,
    type UpdateCustomRoleInput,
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
                user: true,
                customRole: true
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
                inviter: true,
                customRole: true
            },
            orderBy: (invitations, { desc }) => [desc(invitations.createdAt)]
        })

        const customRolesData = await db.query.customRoles.findMany({
            where: eq(customRoles.organizationId, organizationId),
            orderBy: (customRoles, { asc }) => [asc(customRoles.name)]
        })

        return {
            success: true,
            members,
            invitations: pendingInvitations,
            currentUserRole: result.membership.role,
            customRoles: customRolesData
        }
    } catch (error) {
        console.error('Error fetching team data:', error)
        return { error: 'Error al cargar datos del equipo' }
    }
}

// Invite member
export async function inviteMember(input: InviteUserInput, organizationId: string) {
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

    const { email, role: rawRole } = validation.data

    let role: 'ADMIN' | 'MEMBER' | 'ACCOUNTANT' = 'MEMBER'
    let customRoleId: string | null = null

    if (rawRole === 'ADMIN' || rawRole === 'MEMBER' || rawRole === 'ACCOUNTANT') {
        role = rawRole
    } else {
        customRoleId = rawRole
    }

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
        const token = crypto.randomUUID()

        // Set expiration (7 days from now)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        // Create invitation
        const [invitation] = await db.insert(invitations).values({
            email: email.toLowerCase(),
            role,
            customRoleId,
            token,
            organizationId,
            invitedBy: currentUser.id,
            expiresAt,
            status: 'PENDING',
        }).returning()

        revalidatePath('/dashboard/settings')

        // Inject Audit Log
        await logAuditTransaction({
            organizationId,
            userId: currentUser.id,
            action: 'CREATE',
            entityType: 'role_assignment',
            entityId: invitation.id,
            newValues: {
                assignedRole: role,
                assignedCustomRoleId: customRoleId,
                assignedToEmail: email.toLowerCase()
            }
        });

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
        await db.delete(memberships).where(and(eq(memberships.id, memberId), eq(memberships.organizationId, organizationId)))

        // Inject Audit Log
        await logAuditTransaction({
            organizationId,
            userId: currentUser.id,
            action: 'DELETE',
            entityType: 'role_assignment',
            entityId: targetMembership.id,
            oldValues: {
                previousRole: targetMembership.role,
                previousCustomRoleId: targetMembership.customRoleId,
                userId: targetMembership.userId
            }
        });

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
export async function acceptInvite(input: AcceptInvitationInput) {
    const supabase = await createClient()

    // Validate input
    const validation = acceptInvitationSchema.safeParse(input)
    if (!validation.success) {
        return { error: validation.error.errors[0].message }
    }

    const { token, fullName, password } = validation.data

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

        // Verify email doesn't exist in users table yet
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, invitation.email.toLowerCase())
        })

        if (existingUser) {
            return { error: 'EXISTING_ACCOUNT: El correo ya tiene una cuenta. Usa la opción de iniciar sesión.' }
        }

        // Use Admin SDK to create the user with email pre-confirmed.
        // The invite token IS the verification — no confirmation email should be sent.
        const adminAuth = getAdminAuthClient()
        const { data: authData, error: authError } = await adminAuth.admin.createUser({
            email: invitation.email,
            password,
            email_confirm: true,          // skip confirmation email entirely
            user_metadata: { full_name: fullName },
        })

        if (authError) {
            console.error('Supabase signup error:', authError)
            return { error: 'Error al registrar la cuenta en Supabase' }
        }

        if (!authData.user) {
            return { error: 'No se pudo crear el usuario' }
        }

        // Use transaction to create user, membership, and update invitation
        await db.transaction(async (tx) => {
            // Create user
            await tx.insert(users).values({
                id: authData.user!.id,
                email: invitation.email.toLowerCase(),
                fullName,
            })

            // Create membership
            await tx.insert(memberships).values({
                userId: authData.user!.id,
                organizationId: invitation.organizationId,
                role: invitation.role,
                customRoleId: invitation.customRoleId,
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

// Accept invitation for a user who ALREADY has an account
export async function acceptInviteExistingUser(input: {
    token: string
    email: string
    password: string
}) {
    const supabase = await createClient()

    try {
        // Find and validate the invitation
        const invitation = await db.query.invitations.findFirst({
            where: eq(invitations.token, input.token)
        })

        if (!invitation) return { error: 'Invitación no encontrada' }
        if (invitation.status !== 'PENDING') return { error: 'Esta invitación ya no es válida' }
        if (new Date() > new Date(invitation.expiresAt)) {
            await db.update(invitations)
                .set({ status: 'EXPIRED' })
                .where(eq(invitations.id, invitation.id))
            return { error: 'Esta invitación ha expirado' }
        }
        if (invitation.email.toLowerCase() !== input.email.toLowerCase()) {
            return { error: 'El correo no coincide con la invitación' }
        }

        // Sign in with existing credentials
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: input.email,
            password: input.password,
        })

        if (authError || !authData.user) {
            return { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' }
        }

        // Check if already a member of this org
        const existingMembership = await db.query.memberships.findFirst({
            where: and(
                eq(memberships.userId, authData.user.id),
                eq(memberships.organizationId, invitation.organizationId)
            )
        })
        if (existingMembership) {
            return { error: 'Ya eres miembro de esta organización.' }
        }

        // Add membership and mark invitation accepted
        await db.transaction(async (tx) => {
            await tx.insert(memberships).values({
                userId: authData.user!.id,
                organizationId: invitation.organizationId,
                role: invitation.role,
                customRoleId: invitation.customRoleId,
            })
            await tx.update(invitations)
                .set({ status: 'ACCEPTED' })
                .where(eq(invitations.id, invitation.id))
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error accepting invite (existing user):', error)
        return { error: 'Error al procesar la invitación' }
    }
}

// Get custom roles for an organization
export async function getCustomRoles(organizationId: string) {
    const result = await getCurrentUserMembership(organizationId)

    if (!result || !result.membership) {
        return { error: 'No autorizado' }
    }

    try {
        const roles = await db.query.customRoles.findMany({
            where: eq(customRoles.organizationId, organizationId),
            orderBy: (customRoles, { asc }) => [asc(customRoles.name)]
        })

        return { success: true, roles }
    } catch (error) {
        console.error('Error fetching custom roles:', error)
        return { error: 'Error al cargar los roles personalizados' }
    }
}

// Create a new custom role

export async function createCustomRole(input: InsertCustomRoleInput, organizationId: string) {
    const result = await getCurrentUserMembership(organizationId)

    if (!result || !result.membership) {
        return { error: 'No autorizado' }
    }

    // Only OWNER or ADMIN should be able to create custom roles
    if (result.membership.role !== 'OWNER' && result.membership.role !== 'ADMIN') {
        return { error: 'Solo los administradores pueden crear roles personalizados' }
    }

    const validation = insertCustomRoleSchema.safeParse(input)
    if (!validation.success) {
        return { error: validation.error.errors[0].message }
    }

    const { name, description, permissions } = validation.data

    try {
        const [newRole] = await db.insert(customRoles).values({
            organizationId,
            name,
            description,
            permissions,
        }).returning()

        // Inject Audit Log
        await logAuditTransaction({
            organizationId,
            userId: result.user.id,
            action: 'CREATE',
            entityType: 'role_definition',
            entityId: newRole.id,
            newValues: {
                name,
                description,
                permissions
            }
        });

        revalidatePath('/dashboard/settings')
        return { success: true }
    } catch (error) {
        console.error('Error creating custom role:', error)
        return { error: 'Error al crear el rol personalizado' }
    }
}

// Update an existing custom role
export async function updateCustomRole(input: UpdateCustomRoleInput, organizationId: string) {
    const result = await getCurrentUserMembership(organizationId);

    if (!result || !result.membership) {
        return { error: 'No autorizado' };
    }

    if (result.membership.role !== 'OWNER' && result.membership.role !== 'ADMIN') {
        return { error: 'Solo los administradores pueden editar roles personalizados' };
    }

    const validation = updateCustomRoleSchema.safeParse(input);
    if (!validation.success) {
        return { error: validation.error.errors[0].message };
    }

    const { id, name, description, permissions } = validation.data;

    try {
        // Fetch original to record old values
        const originalRole = await db.query.customRoles.findFirst({
            where: and(
                eq(customRoles.id, id),
                eq(customRoles.organizationId, organizationId)
            )
        });

        const [updated] = await db.update(customRoles)
            .set({ name, description, permissions })
            .where(
                and(
                    eq(customRoles.id, id),
                    eq(customRoles.organizationId, organizationId)
                )
            )
            .returning();

        if (!updated) {
            return { error: 'No se encontró el rol especificado o no tienes acceso' };
        }

        // Inject Audit Log
        if (originalRole) {
            await logAuditTransaction({
                organizationId,
                userId: result.user.id,
                action: 'UPDATE',
                entityType: 'role_definition',
                entityId: updated.id,
                oldValues: {
                    name: originalRole.name,
                    description: originalRole.description,
                    permissions: originalRole.permissions
                },
                newValues: {
                    name: updated.name,
                    description: updated.description,
                    permissions: updated.permissions
                }
            });
        }

        revalidatePath('/dashboard/settings');
        return { success: true };
    } catch (error) {
        console.error('Error updating custom role:', error);
        return { error: 'Error al actualizar el rol personalizado' };
    }
}

// Delete custom role
export async function deleteCustomRole(roleId: string, organizationId: string) {
    const result = await getCurrentUserMembership(organizationId);

    if (!result || !result.membership) {
        return { error: 'No autorizado' };
    }

    if (result.membership.role !== 'OWNER' && result.membership.role !== 'ADMIN') {
        return { error: 'Solo los administradores pueden eliminar roles personalizados' };
    }

    try {
        // Validation Constraint: Check if users are assigned to this role
        const assignedMemberships = await db.query.memberships.findMany({
            where: and(
                eq(memberships.customRoleId, roleId),
                eq(memberships.organizationId, organizationId)
            )
        });

        if (assignedMemberships.length > 0) {
            return { error: 'No puedes eliminar este rol porque hay miembros del equipo que lo tienen asignado.' };
        }

        // Fetch original to record old values
        const originalRole = await db.query.customRoles.findFirst({
            where: and(
                eq(customRoles.id, roleId),
                eq(customRoles.organizationId, organizationId)
            )
        });

        const [deleted] = await db.delete(customRoles)
            .where(
                and(
                    eq(customRoles.id, roleId),
                    eq(customRoles.organizationId, organizationId)
                )
            )
            .returning();

        if (!deleted) {
            return { error: 'Rol no encontrado o ya eliminado' };
        }

        // Inject Audit Log
        if (originalRole) {
            await logAuditTransaction({
                organizationId,
                userId: result.user.id,
                action: 'DELETE',
                entityType: 'role_definition',
                entityId: deleted.id,
                oldValues: {
                    name: originalRole.name,
                    description: originalRole.description,
                    permissions: originalRole.permissions
                }
            });
        }

        revalidatePath('/dashboard/settings');
        return { success: true };
    } catch (error) {
        console.error('Error deleting custom role:', error);
        return { error: 'Error al eliminar el rol personalizado' };
    }
}
