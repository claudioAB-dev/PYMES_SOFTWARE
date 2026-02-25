"use client"

import { useEffect, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
    Users, Mail, Trash2, Copy, XCircle, Shield, UserPlus,
    Loader2, CheckCircle2, Clock, AlertTriangle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { inviteUserSchema, type InviteUserInput } from "@/lib/validators/team"
import {
    getTeamData,
    inviteUser,
    removeMember,
    revokeInvitation
} from "./team/actions"

interface MembersTabProps {
    organizationId: string
    currentUserRole: 'OWNER' | 'ADMIN' | 'MEMBER' | 'ACCOUNTANT'
}

const roleColors = {
    OWNER: "bg-purple-500",
    ADMIN: "bg-blue-500",
    MEMBER: "bg-gray-500",
    ACCOUNTANT: "bg-green-500",
}

const roleLabels = {
    OWNER: "Propietario",
    ADMIN: "Administrador",
    MEMBER: "Miembro",
    ACCOUNTANT: "Contador",
}

export function MembersTab({ organizationId, currentUserRole }: MembersTabProps) {
    const [teamData, setTeamData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [inviteLink, setInviteLink] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const canManageTeam = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'

    const form = useForm<InviteUserInput>({
        resolver: zodResolver(inviteUserSchema),
        defaultValues: {
            email: "",
            role: "MEMBER",
        },
    })

    // Load team data
    const loadTeamData = async () => {
        setIsLoading(true)
        const result = await getTeamData(organizationId)
        if (result.error) {
            toast.error(result.error)
        } else {
            setTeamData(result)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        loadTeamData()
    }, [organizationId])

    // Handle invitation
    const onInvite = async (data: InviteUserInput) => {
        startTransition(async () => {
            const result = await inviteUser(data, organizationId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Invitación creada correctamente")
                setInviteLink(result.inviteLink || null)
                form.reset()
                loadTeamData()
            }
        })
    }

    // Copy invitation link
    const copyInviteLink = (link: string) => {
        navigator.clipboard.writeText(link)
        toast.success("Link copiado al portapapeles")
    }

    // Remove member
    const handleRemoveMember = async (memberId: string) => {
        const result = await removeMember(memberId, organizationId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Miembro eliminado correctamente")
            loadTeamData()
        }
    }

    // Revoke invitation
    const handleRevokeInvitation = async (invitationId: string) => {
        const result = await revokeInvitation(invitationId, organizationId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Invitación revocada")
            loadTeamData()
        }
    }

    // Format date
    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    // Calculate time until expiration
    const getExpirationText = (expiresAt: Date | string) => {
        const now = new Date()
        const expiry = new Date(expiresAt)
        const diffMs = expiry.getTime() - now.getTime()
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays < 0) return "Expirado"
        if (diffDays === 0) return "Expira hoy"
        if (diffDays === 1) return "Expira mañana"
        return `Expira en ${diffDays} días`
    }

    return (
        <div className="space-y-6">
            {/* Invitation Form - Only for ADMIN/OWNER */}
            {canManageTeam && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Invitar Nuevo Miembro
                        </CardTitle>
                        <CardDescription>
                            Genera un enlace de invitación para agregar miembros a tu equipo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onInvite)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="email">Correo Electrónico</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="usuario@ejemplo.com"
                                        {...form.register("email")}
                                    />
                                    {form.formState.errors.email && (
                                        <p className="text-sm text-red-500">
                                            {form.formState.errors.email.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Rol</Label>
                                    <Select
                                        value={form.watch("role")}
                                        onValueChange={(value) => form.setValue("role", value as any)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un rol" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MEMBER">Miembro</SelectItem>
                                            {currentUserRole === 'OWNER' && (
                                                <SelectItem value="ADMIN">Administrador</SelectItem>
                                            )}
                                            <SelectItem value="ACCOUNTANT">Contador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button type="submit" disabled={isPending}>
                                {isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Mail className="mr-2 h-4 w-4" />
                                )}
                                Generar Invitación
                            </Button>
                        </form>

                        {/* Display generated invite link */}
                        {inviteLink && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div className="flex-1 space-y-2">
                                        <p className="text-sm font-medium text-green-900">
                                            Invitación creada correctamente
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 p-2 bg-white border rounded text-xs break-all">
                                                {inviteLink}
                                            </code>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => copyInviteLink(inviteLink)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <p className="text-xs text-green-700">
                                            Comparte este enlace con el usuario invitado. Expira en 7 días.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Current Members */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Miembros del Equipo
                    </CardTitle>
                    <CardDescription>
                        Usuarios con acceso a esta organización.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : teamData?.members?.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Fecha de Ingreso</TableHead>
                                    {canManageTeam && <TableHead className="text-right">Acciones</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teamData.members.map((member: any) => {
                                    const isOwner = member.role === 'OWNER'
                                    const ownerCount = teamData.members.filter((m: any) => m.role === 'OWNER').length
                                    const canRemove = canManageTeam && !(isOwner && ownerCount <= 1)

                                    return (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={member.user?.avatarUrl} />
                                                        <AvatarFallback className="text-xs">
                                                            {member.user?.email?.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {member.user?.fullName || member.user?.email}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {member.user?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={`${roleColors[member.role as keyof typeof roleColors]} text-white`}
                                                >
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    {roleLabels[member.role as keyof typeof roleLabels]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(member.createdAt)}
                                            </TableCell>
                                            {canManageTeam && (
                                                <TableCell className="text-right">
                                                    {canRemove ? (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        {member.user?.email} perderá acceso a la organización.
                                                                        Esta acción no se puede deshacer.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleRemoveMember(member.id)}
                                                                        className="bg-red-500 hover:bg-red-600"
                                                                    >
                                                                        Eliminar
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center py-8 text-muted-foreground">
                            No hay miembros en el equipo
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Pending Invitations - Only visible to ADMIN/OWNER */}
            {canManageTeam && teamData?.invitations?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Invitaciones Pendientes
                        </CardTitle>
                        <CardDescription>
                            Invitaciones que aún no han sido aceptadas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Correo</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Expira</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teamData.invitations.map((invitation: any) => {
                                    const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite?token=${invitation.token}`
                                    const expirationText = getExpirationText(invitation.expiresAt)
                                    const isExpired = expirationText === "Expirado"

                                    return (
                                        <TableRow key={invitation.id}>
                                            <TableCell className="font-medium">
                                                {invitation.email}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {roleLabels[invitation.role as keyof typeof roleLabels]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm">
                                                    {isExpired ? (
                                                        <>
                                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                                            <span className="text-red-500">{expirationText}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-muted-foreground">{expirationText}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => copyInviteLink(inviteLink)}
                                                    >
                                                        <Copy className="h-4 w-4 mr-1" />
                                                        Copiar Link
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <XCircle className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>¿Revocar invitación?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    La invitación para {invitation.email} será cancelada
                                                                    y el enlace dejará de funcionar.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleRevokeInvitation(invitation.id)}
                                                                    className="bg-red-500 hover:bg-red-600"
                                                                >
                                                                    Revocar
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
