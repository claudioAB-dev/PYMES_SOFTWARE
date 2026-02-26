"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import {
    Users, Trash2, Copy, XCircle, Shield,
    Loader2, Clock, AlertTriangle, MoreHorizontal
} from "lucide-react"

import { Button } from "@/components/ui/button"
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
    getTeamData,
    removeMember,
    revokeInvitation
} from "./team/actions"
import { InviteMemberDialog } from "./team/invite-member-dialog"

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
    const [memberToRemove, setMemberToRemove] = useState<string | null>(null)
    const [invitationToRevoke, setInvitationToRevoke] = useState<string | null>(null)

    const canManageTeam = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'

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

    // Copy invitation link
    const copyInviteLink = (link: string) => {
        navigator.clipboard.writeText(link)
        toast.success("Link copiado al portapapeles")
    }

    // Remove member
    const handleRemoveMember = async () => {
        if (!memberToRemove) return
        const result = await removeMember(memberToRemove, organizationId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Miembro eliminado correctamente")
            loadTeamData()
        }
        setMemberToRemove(null)
    }

    // Revoke invitation
    const handleRevokeInvitation = async () => {
        if (!invitationToRevoke) return
        const result = await revokeInvitation(invitationToRevoke, organizationId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Invitación revocada")
            loadTeamData()
        }
        setInvitationToRevoke(null)
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
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Gestión del Equipo</h3>
                    <p className="text-sm text-muted-foreground">
                        Administra los miembros de tu organización y sus roles.
                    </p>
                </div>
                {canManageTeam && (
                    <InviteMemberDialog
                        organizationId={organizationId}
                        currentUserRole={currentUserRole}
                        onSuccess={loadTeamData}
                    />
                )}
            </div>

            {/* Current Members */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-md flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        Miembros Activos
                    </CardTitle>
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
                                    <TableHead>Miembro</TableHead>
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
                                                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                            {member.user?.fullName?.substring(0, 2).toUpperCase() || member.user?.email?.substring(0, 2).toUpperCase()}
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
                                                    className={`${roleColors[member.role as keyof typeof roleColors]} text-white font-medium`}
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
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <span className="sr-only">Abrir menú</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                                {/* Future update: Change Role */}
                                                                {/* <DropdownMenuItem>Cambiar Rol</DropdownMenuItem> */}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-600 cursor-pointer"
                                                                    onClick={() => setMemberToRemove(member.id)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Eliminar Miembro
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground px-2 py-1">—</span>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                            No hay miembros en el equipo
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Pending Invitations - Only visible to ADMIN/OWNER */}
            {canManageTeam && teamData?.invitations?.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-md flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            Invitaciones Pendientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Correo Invitado</TableHead>
                                    <TableHead>Rol Asignado</TableHead>
                                    <TableHead>Estado</TableHead>
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
                                                <Badge variant="outline" className="font-medium">
                                                    {roleLabels[invitation.role as keyof typeof roleLabels]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm bg-muted/40 w-fit px-2 py-1 rounded-md">
                                                    {isExpired ? (
                                                        <>
                                                            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                                            <span className="text-red-500 font-medium">{expirationText}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span className="text-muted-foreground">{expirationText}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menú</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => copyInviteLink(inviteLink)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Copy className="mr-2 h-4 w-4" />
                                                            Copiar Enlace
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setInvitationToRevoke(invitation.id)}
                                                            className="text-red-600 focus:text-red-600 cursor-pointer"
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Revocar Invitación
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Alert Dialogs for dangerous actions */}
            <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Este usuario perderá el acceso a la organización.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveMember}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!invitationToRevoke} onOpenChange={(open) => !open && setInvitationToRevoke(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Revocar invitación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            La invitación será cancelada y el enlace dejará de funcionar inmediatamente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRevokeInvitation}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Revocar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
