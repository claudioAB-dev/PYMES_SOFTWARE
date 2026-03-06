import { createClient } from "@/lib/supabase/server"
import { db } from "@/db"
import { memberships } from "@/db/schema" // memberships is exported from schema
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralTab } from "./general-tab"
import { MembersTab } from "./members-tab"
import { TaxesTab } from "./taxes-tab"
import { PreferencesTab } from "./preferences-tab"

async function getOrganization() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
        with: {
            organization: true
        }
    })

    if (userMemberships.length === 0) return null

    return {
        organization: userMemberships[0].organization,
        role: userMemberships[0].role
    }
}

export default async function SettingsPage() {
    const data = await getOrganization()

    if (!data) {
        redirect('/login')
    }

    const { organization, role } = data

    return (
        <div className="container mx-auto py-6 space-y-6" suppressHydrationWarning>
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="members">Equipo</TabsTrigger>
                    <TabsTrigger value="taxes">Impuestos</TabsTrigger>
                    <TabsTrigger value="preferences">Preferencias</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="space-y-4">
                    <GeneralTab organization={organization} />
                </TabsContent>
                <TabsContent value="members" className="space-y-4">
                    <MembersTab organizationId={organization.id} currentUserRole={role} />
                </TabsContent>
                <TabsContent value="taxes" className="space-y-4">
                    <TaxesTab organizationId={organization.id} />
                </TabsContent>
                <TabsContent value="preferences" className="space-y-4">
                    <PreferencesTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
