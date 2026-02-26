"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, UserPlus, CheckCircle2, Copy, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { inviteUserSchema, type InviteUserInput } from "@/lib/validators/team"
import { inviteMember } from "./actions"

export function InviteMemberDialog({
    organizationId,
    currentUserRole,
    onSuccess,
}: {
    organizationId: string
    currentUserRole: string
    onSuccess: () => void
}) {
    const [open, setOpen] = useState(false)
    const [inviteLink, setInviteLink] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const form = useForm<InviteUserInput>({
        resolver: zodResolver(inviteUserSchema),
        defaultValues: {
            email: "",
            role: "MEMBER",
        },
    })

    const onInvite = async (data: InviteUserInput) => {
        startTransition(async () => {
            const result = await inviteMember(data, organizationId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Invitación creada correctamente")
                setInviteLink(result.inviteLink || null)
                form.reset()
                onSuccess()
            }
        })
    }

    const copyInviteLink = (link: string) => {
        navigator.clipboard.writeText(link)
        toast.success("Link copiado al portapapeles")
    }

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (!newOpen) {
            // Reset state when closing
            setTimeout(() => {
                setInviteLink(null)
                form.reset()
            }, 200)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invitar Miembro
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invitar al equipo</DialogTitle>
                    <DialogDescription>
                        Genera un enlace de invitación para agregar un nuevo miembro a tu organización.
                    </DialogDescription>
                </DialogHeader>

                {!inviteLink ? (
                    <form onSubmit={form.handleSubmit(onInvite)} className="space-y-4 py-4">
                        <div className="space-y-2">
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
                            {form.formState.errors.role && (
                                <p className="text-sm text-red-500">
                                    {form.formState.errors.role.message}
                                </p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Mail className="mr-2 h-4 w-4" />
                            )}
                            Generar Invitación
                        </Button>
                    </form>
                ) : (
                    <div className="py-4 space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex flex-col items-center text-center gap-2">
                                <CheckCircle2 className="h-8 w-8 text-green-600 mb-2" />
                                <p className="font-medium text-green-900">
                                    ¡Invitación generada con éxito!
                                </p>
                                <p className="text-sm text-green-700">
                                    Copia el siguiente enlace y envíalo a tu invitado. Este enlace expirará en 7 días.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Input value={inviteLink} readOnly className="flex-1" />
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => copyInviteLink(inviteLink)}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleOpenChange(false)}
                        >
                            Cerrar
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
