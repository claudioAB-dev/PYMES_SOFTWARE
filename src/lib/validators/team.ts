import { z } from "zod";

// Role validation - only ADMIN and MEMBER can be assigned via invitations
export const inviteUserSchema = z.object({
    email: z.string().email("Ingresa un correo electrónico válido"),
    role: z.string().min(1, "Selecciona un rol"),
    customRoleId: z.string().uuid().optional(),
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
    newRole: z.string().min(1, "Selecciona un rol válido"),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
export type RevokeInvitationInput = z.infer<typeof revokeInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export const insertCustomRoleSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().optional(),
    permissions: z.array(z.string()).default([]),
});

export type PermissionId =
    | 'view:dashboard'
    | 'view:entities'
    | 'view:products'
    | 'view:orders'
    | 'view:purchases'
    | 'manage:purchases'
    | 'manage:quick-expenses'
    | 'view:hr'
    | 'view:payroll'
    | 'view:treasury'
    | 'view:receivables'
    | 'view:reconciliation'
    | 'view:settings';

export const AVAILABLE_PERMISSIONS: { id: PermissionId, name: string, category: string }[] = [
    { id: 'view:dashboard', name: 'Ver Resumen (Dashboard)', category: 'General' },
    { id: 'view:entities', name: 'Gestión de Clientes/Proveedores', category: 'General' },
    { id: 'view:products', name: 'Catálogo de Productos', category: 'Inventario' },
    { id: 'view:orders', name: 'Ventas y Cotizaciones', category: 'Ventas' },
    { id: 'view:purchases', name: 'Historial de Compras (Solo lectura)', category: 'Compras' },
    { id: 'manage:purchases', name: 'Gestión de Compras a Proveedores', category: 'Operaciones' },
    { id: 'manage:quick-expenses', name: 'Registro de Gastos y Caja Chica', category: 'Operaciones' },
    { id: 'view:hr', name: 'Recursos Humanos', category: 'Nómina' },
    { id: 'view:payroll', name: 'Recibos de Nómina', category: 'Nómina' },
    { id: 'view:treasury', name: 'Tesorería y Bancos', category: 'Finanzas' },
    { id: 'view:receivables', name: 'Cuentas por Cobrar/Pagar', category: 'Finanzas' },
    { id: 'view:reconciliation', name: 'Conciliación', category: 'Administración' },
    { id: 'view:settings', name: 'Configuración de la Empresa', category: 'Administración' }
];

export const updateCustomRoleSchema = insertCustomRoleSchema.extend({
    id: z.string().uuid("ID de rol inválido"),
});

export type InsertCustomRoleInput = z.infer<typeof insertCustomRoleSchema>;
export type UpdateCustomRoleInput = z.infer<typeof updateCustomRoleSchema>;
