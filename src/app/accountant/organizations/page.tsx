import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { memberships, invitations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Mail } from "lucide-react";
import { InviteClientDialog } from "../components/invite-client-dialog";
import { ClientCard, PendingInviteCard } from "./client-components";

export default async function AccountantOrganizationsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.user_metadata?.is_accountant) {
        redirect('/login');
    }

    // Fetch active memberships
    const userMemberships = await db.query.memberships.findMany({
        where: and(
            eq(memberships.userId, user.id),
            eq(memberships.role, 'ACCOUNTANT')
        ),
        with: {
            organization: true
        }
    });

    // Fetch pending invitations sent by this accountant
    const pendingInvites = await db.query.invitations.findMany({
        where: and(
            eq(invitations.invitedBy, user.id),
            eq(invitations.status, 'PENDING')
        ),
        with: {
            organization: true
        }
    });

    // Filter out active memberships that are actually just pending invitations
    // A membership is "active" if it doesn't have a pending invitation for its organization
    const pendingOrgIds = new Set(pendingInvites.map(inv => inv.organizationId));
    const activeClients = userMemberships.filter(m => !pendingOrgIds.has(m.organizationId));

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestión de Cartera</h2>
                    <p className="text-muted-foreground">
                        Administra tus clientes y las invitaciones enviadas.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <InviteClientDialog />
                </div>
            </div>

            <Tabs defaultValue="clients" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="clients">Mis Clientes</TabsTrigger>
                    <TabsTrigger value="invites">
                        Invitaciones Pendientes
                        {pendingInvites.length > 0 && (
                            <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                                {pendingInvites.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="clients" className="space-y-4">
                    {activeClients.length === 0 ? (
                        <div className="flex h-[400px] shrink-0 items-center justify-center rounded-md border border-dashed text-sm">
                            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                                <Building2 className="h-10 w-10 text-muted-foreground mb-4" />
                                <h3 className="mt-4 text-lg font-semibold">No tienes clientes activos</h3>
                                <p className="mb-4 mt-2 text-muted-foreground">
                                    Invita a un nuevo cliente para comenzar a administrar su contabilidad o espera a que acepten tu invitación.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {activeClients.map((membership) => (
                                <ClientCard key={membership.id} organization={membership.organization} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="invites" className="space-y-4">
                    {pendingInvites.length === 0 ? (
                        <div className="flex h-[400px] shrink-0 items-center justify-center rounded-md border border-dashed text-sm">
                            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                                <Mail className="h-10 w-10 text-muted-foreground mb-4" />
                                <h3 className="mt-4 text-lg font-semibold">No hay invitaciones pendientes</h3>
                                <p className="mb-4 mt-2 text-muted-foreground">
                                    Las invitaciones que envíes a nuevos clientes aparecerán aquí hasta que sean aceptadas.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {pendingInvites.map((invite) => (
                                <PendingInviteCard key={invite.id} invite={invite} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
