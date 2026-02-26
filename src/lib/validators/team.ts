import { z } from "zod";

// Role validation - only ADMIN and MEMBER can be assigned via invitations
// OWNER role is only set during organization creation
export const inviteUserSchema = z.object({
    email: z.string().email("Ingresa un correo electrónico válido"),
    role: z.enum(["ADMIN", "MEMBER", "ACCOUNTANT"], {
        required_error: "Selecciona un rol",
    }),
    organizationId: z.string().uuid().optional(), // Will be set server-side
});

export const removeMemberSchema = z.object({
    memberId: z.string().uuid("ID de miembro inválido"),
});

export const revokeInvitationSchema = z.object({
    invitationId: z.string().uuid("ID de invitación inválido"),
});

export const acceptInvitationSchema = z.object({
    token: z.string().min(1, "Token de invitación requerido"),
    fullName: z.string().min(2, "Ingresa tu nombre completo"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

// Future use: update member role
export const updateMemberRoleSchema = z.object({
    memberId: z.string().uuid("ID de miembro inválido"),
    newRole: z.enum(["ADMIN", "MEMBER", "ACCOUNTANT"], {
        required_error: "Selecciona un rol válido",
    }),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
export type RevokeInvitationInput = z.infer<typeof revokeInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
