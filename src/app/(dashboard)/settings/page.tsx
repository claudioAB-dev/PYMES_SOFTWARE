import { createClient } from "@/lib/supabase/server"
import { db } from "@/db"
import { memberships } from "@/db/schema" // memberships is exported from schema
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralTab } from "./general-tab"
import { MembersTab } from "./members-tab"

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

    return userMemberships[0].organization
}

export default async function SettingsPage() {
    const organization = await getOrganization()

    if (!organization) {
        redirect('/login')
    }

    return (
        <div className="flex-1 space-y-4 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="members">Miembros</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="space-y-4">
                    <GeneralTab organization={organization} />
                </TabsContent>
                <TabsContent value="members" className="space-y-4">
                    <MembersTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
