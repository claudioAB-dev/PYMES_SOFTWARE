import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

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
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
