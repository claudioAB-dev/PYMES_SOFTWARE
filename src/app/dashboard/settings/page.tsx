import { createClient } from "@/lib/supabase/server"
import { db } from "@/db"
import { memberships } from "@/db/schema" // memberships is exported from schema
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ShieldAlert } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { GeneralTab } from "./general-tab"
import { MembersTab } from "./members-tab"
import { TaxesTab } from "./taxes-tab"
import { PreferencesTab } from "./preferences-tab"
import { RolesTab } from "./roles-tab"
import { PlanTab } from "./plan-tab"
import { getCustomRoles } from "./team/actions"

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

    // Fetch custom roles for the Roles Tab
    const customRolesResponse = await getCustomRoles(organization.id)
    const customRoles = customRolesResponse.roles || []

    return (
        <div className="container mx-auto py-6 space-y-6" suppressHydrationWarning>
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
                {role === 'OWNER' || role === 'ADMIN' ? (
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/settings/audit">
                            <ShieldAlert className="w-4 h-4 mr-2" />
                            Auditoría
                        </Link>
                    </Button>
                ) : null}
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="members">Equipo</TabsTrigger>
                    {role === 'OWNER' || role === 'ADMIN' ? (
                        <TabsTrigger value="roles">Roles</TabsTrigger>
                    ) : null}
                    <TabsTrigger value="taxes">Impuestos</TabsTrigger>
                    <TabsTrigger value="plan">Plan</TabsTrigger>
                    <TabsTrigger value="preferences">Preferencias</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="space-y-4">
                    <GeneralTab organization={organization} />
                </TabsContent>
                <TabsContent value="members" className="space-y-4">
                    <MembersTab organizationId={organization.id} currentUserRole={role} />
                </TabsContent>
                {role === 'OWNER' || role === 'ADMIN' ? (
                    <TabsContent value="roles" className="space-y-4">
                        <RolesTab organizationId={organization.id} roles={customRoles} />
                    </TabsContent>
                ) : null}
                <TabsContent value="taxes" className="space-y-4">
                    <TaxesTab organizationId={organization.id} />
                </TabsContent>
                <TabsContent value="plan" className="space-y-4">
                    <PlanTab organization={organization} />
                </TabsContent>
                <TabsContent value="preferences" className="space-y-4">
                    <PreferencesTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
