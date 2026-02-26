import { Suspense } from "react"
import { db } from "@/db"
import { invitations } from "@/db/schema"
import { eq } from "drizzle-orm"
import { InviteAcceptForm } from "./invite-accept-form"
import { AlertTriangle } from "lucide-react"
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export default async function InvitePage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <Suspense fallback={<div className="text-center text-muted-foreground animate-pulse font-medium">Cargando detalles de la invitación...</div>}>
                <InviteContent searchParams={searchParams} />
            </Suspense>
        </div>
    )
}

async function InviteContent({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const params = await searchParams
    const token = params.token as string

    if (!token) {
        return <InvalidInviteCard message="Falta el token de invitación en la URL." />
    }

    try {
        const invitationWithDetails = await db.query.invitations.findFirst({
            where: eq(invitations.token, token),
            with: {
                organization: true,
                inviter: true,
            }
        })

        if (!invitationWithDetails) {
            return <InvalidInviteCard message="El enlace de invitación no es válido o ha expirado." />
        }

        if (invitationWithDetails.status !== 'PENDING') {
            return <InvalidInviteCard message="Esta invitación ya ha sido aceptada, revocada o ha expirado." />
        }

        if (new Date() > new Date(invitationWithDetails.expiresAt)) {
            return <InvalidInviteCard message="Esta invitación ha expirado. Por favor, solicita una nueva a tu administrador." />
        }

        // Pass details to the form
        return (
            <InviteAcceptForm
                token={token}
                email={invitationWithDetails.email}
                role={invitationWithDetails.role}
                organizationName={invitationWithDetails.organization?.name || "la organización"}
                inviterName={invitationWithDetails.inviter?.fullName || invitationWithDetails.inviter?.email || "Un administrador"}
            />
        )
    } catch (err) {
        console.error("Error reading invite:", err);
        return <InvalidInviteCard message="Ocurrió un error al verificar la invitación. Inténtalo de nuevo." />
    }
}

function InvalidInviteCard({ message }: { message: string }) {
    return (
        <Card className="w-full max-w-md shadow-lg border-red-100">
            <CardHeader className="text-center pb-6 pt-8">
                <div className="mx-auto bg-red-100 p-3 rounded-full w-fit mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-xl text-red-900">Invitación Inválida</CardTitle>
                <CardDescription className="text-sm mt-3 text-red-800/80">
                    {message}
                </CardDescription>
            </CardHeader>
        </Card>
    )
}
