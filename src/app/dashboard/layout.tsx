import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { memberships, users, invitations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Intercept invite token to bypass onboarding if applicable
    const cookieStore = await cookies();
    const inviteToken = cookieStore.get("axioma_invite_token")?.value;

    if (inviteToken) {
        const invitation = await db.query.invitations.findFirst({
            where: eq(invitations.token, inviteToken)
        });

        if (
            invitation &&
            invitation.status === 'PENDING' &&
            new Date() <= new Date(invitation.expiresAt) &&
            user.email?.toLowerCase() === invitation.email.toLowerCase()
        ) {
            try {
                await db.transaction(async (tx) => {
                    const existingUserRef = await tx.query.users.findFirst({
                        where: eq(users.id, user.id)
                    });

                    if (!existingUserRef) {
                        await tx.insert(users).values({
                            id: user.id,
                            email: user.email!,
                            fullName: user.user_metadata?.full_name || null
                        });
                    }

                    const existingMembership = await tx.query.memberships.findFirst({
                        where: (m, { and, eq }) => and(
                            eq(m.userId, user.id),
                            eq(m.organizationId, invitation.organizationId)
                        )
                    });

                    if (!existingMembership) {
                        await tx.insert(memberships).values({
                            userId: user.id,
                            organizationId: invitation.organizationId,
                            role: invitation.role,
                        });
                    }

                    await tx.update(invitations)
                        .set({ status: 'ACCEPTED' })
                        .where(eq(invitations.id, invitation.id));
                });

                redirect("/dashboard");
            } catch (error) {
                console.error("Error processing invite token in layout:", error);
            }
        }
    }

    // Check if user has any memberships and fetch organization details
    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
        with: {
            organization: true,
        },
    });

    if (userMemberships.length === 0) {
        redirect("/onboarding");
    }

    // For now, just take the first organization. In future, handle switching/active org.
    const activeOrganization = userMemberships[0].organization;

    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                <DashboardSidebar />
            </div>
            <main className="md:pl-72">
                <DashboardHeader
                    organizationName={activeOrganization.name}
                    userEmail={user.email}
                />
                <div className="p-8" suppressHydrationWarning>
                    {children}
                </div>
            </main>
        </div>
    );
}
