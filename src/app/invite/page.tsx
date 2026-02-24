import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { InviteAcceptForm } from "./invite-accept-form"

export default function InvitePage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Suspense fallback={<div className="text-center">Cargando...</div>}>
                <InviteContent />
            </Suspense>
        </div>
    )
}

async function InviteContent() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // If not logged in, redirect to login with return URL
    if (!user) {
        redirect('/login')
    }

    return <InviteAcceptForm userEmail={user.email || ''} />
}
