"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, UserPlus, Mail, Shield, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { acceptInvitationSchema, type AcceptInvitationInput } from "@/lib/validators/team"
import { acceptInvite } from "@/app/dashboard/settings/team/actions"

interface InviteAcceptFormProps {
    token: string
    email: string
    role: string
    organizationName: string
    inviterName: string
}

const roleLabels: Record<string, string> = {
    OWNER: "Propietario",
    ADMIN: "Administrador",
    MEMBER: "Miembro",
    ACCOUNTANT: "Contador",
}

export function InviteAcceptForm({
    token, email, role, organizationName, inviterName
}: InviteAcceptFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<AcceptInvitationInput>({
        resolver: zodResolver(acceptInvitationSchema),
        defaultValues: {
            token,
            fullName: "",
            password: "",
        },
    })

    const onSubmit = async (data: AcceptInvitationInput) => {
        setIsLoading(true)
        setError(null)

        const result = await acceptInvite(data)

        if (result?.error) {
            setError(result.error)
            toast.error(result.error)
            setIsLoading(false)
        } else {
            toast.success('¡Cuenta creada y agregada al equipo!')
            // Redirect to dashboard
            router.push('/dashboard')
            // Delay disabling loading slightly so redirection happens smoothly
            setTimeout(() => setIsLoading(false), 2000)
        }
    }

    return (
        <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
            <CardHeader className="text-center space-y-4">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                    <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold">Únete al equipo</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                        <span className="font-semibold text-foreground">{inviterName}</span> te ha invitado a unirte a <span className="font-semibold text-foreground">{organizationName}</span>.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg mb-6 flex flex-col gap-3 border">
                    <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">Asignado a:</span>
                        <span className="font-semibold truncate">{email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">Tu rol será:</span>
                        <Badge variant="secondary">{roleLabels[role] || role}</Badge>
                    </div>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-medium">Tu nombre completo</Label>
                        <Input
                            id="fullName"
                            placeholder="Ej. Juan Pérez"
                            disabled={isLoading}
                            {...form.register("fullName")}
                        />
                        {form.formState.errors.fullName && (
                            <p className="text-xs text-red-500">
                                {form.formState.errors.fullName.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">Crea una contraseña</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            disabled={isLoading}
                            {...form.register("password")}
                        />
                        {form.formState.errors.password && (
                            <p className="text-xs text-red-500">
                                {form.formState.errors.password.message}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-4 h-11"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creando tu cuenta...
                            </>
                        ) : (
                            <>
                                Aceptar Invitación y Entrar
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center border-t p-4 bg-muted/10 mt-2">
                <p className="text-xs text-center text-muted-foreground w-full">
                    Al aceptar, confirmarás la creación de tu cuenta y tendrás acceso al sistema de acuerdo a los permisos de tu rol asignado.
                </p>
            </CardFooter>
        </Card>
    )
}
