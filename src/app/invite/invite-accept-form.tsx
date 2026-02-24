"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Loader2, CheckCircle2, Mail, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { acceptInvitation } from "@/app/(dashboard)/settings/team/actions"

interface InviteAcceptFormProps {
    userEmail: string
}

export function InviteAcceptForm({ userEmail }: InviteAcceptFormProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleAccept = async () => {
        if (!token) {
            setError('Token de invitación no válido')
            return
        }

        setIsLoading(true)
        setError(null)

        const result = await acceptInvitation(token)

        if (result.error) {
            setError(result.error)
            toast.error(result.error)
        } else {
            toast.success('¡Invitación aceptada correctamente!')
            // Redirect to dashboard
            router.push('/dashboard')
        }

        setIsLoading(false)
    }

    if (!token) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                        <CardTitle>Invitación Inválida</CardTitle>
                    </div>
                    <CardDescription>
                        El enlace de invitación no es válido o ha expirado.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push('/dashboard')}
                    >
                        Ir al Dashboard
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Mail className="h-6 w-6 text-blue-500" />
                    <CardTitle>Invitación al Equipo</CardTitle>
                </div>
                <CardDescription>
                    Has sido invitado a unirte a una organización
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                        <span className="font-medium">Tu correo:</span> {userEmail}
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                            <p className="text-sm text-red-900">{error}</p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <Button
                        onClick={handleAccept}
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Aceptando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Aceptar Invitación
                            </>
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => router.push('/dashboard')}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                    Al aceptar, tendrás acceso a los datos de la organización según tu rol asignado.
                </p>
            </CardContent>
        </Card>
    )
}

