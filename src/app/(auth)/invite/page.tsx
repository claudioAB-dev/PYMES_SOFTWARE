import { Suspense } from "react"
import { db } from "@/db"
import { invitations } from "@/db/schema"
import { eq } from "drizzle-orm"
import { InviteAcceptForm } from "./invite-accept-form"
import { AlertTriangle, Loader2 } from "lucide-react"
import Link from "next/link"

export default async function InvitePage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    return (
        <Suspense
            fallback={
                <div className="flex flex-col items-center justify-center gap-3 text-gray-500 py-8">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6366f1' }} />
                    <span className="text-sm">Cargando detalles de la invitación...</span>
                </div>
            }
        >
            <InviteContent searchParams={searchParams} />
        </Suspense>
    )
}

async function InviteContent({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
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
            },
        })

        if (!invitationWithDetails) {
            return <InvalidInviteCard message="El enlace de invitación no es válido o no existe." />
        }

        if (invitationWithDetails.status !== "PENDING") {
            return (
                <InvalidInviteCard message="Esta invitación ya fue aceptada, revocada o expiró." />
            )
        }

        if (new Date() > new Date(invitationWithDetails.expiresAt)) {
            return (
                <InvalidInviteCard message="Esta invitación ha expirado. Solicita una nueva a tu administrador." />
            )
        }

        return (
            <InviteAcceptForm
                token={token}
                email={invitationWithDetails.email}
                role={invitationWithDetails.role}
                organizationName={invitationWithDetails.organization?.name || "la organización"}
                inviterName={
                    invitationWithDetails.inviter?.fullName ||
                    invitationWithDetails.inviter?.email ||
                    "Un administrador"
                }
            />
        )
    } catch (err) {
        console.error("Error reading invite:", err)
        return (
            <InvalidInviteCard message="Ocurrió un error al verificar la invitación. Inténtalo de nuevo." />
        )
    }
}

function InvalidInviteCard({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' }}>
                <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
                Invitación inválida
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-6">
                {message}
            </p>

            <Link
                href="/login"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
                ← Volver al inicio de sesión
            </Link>
        </div>
    )
}
