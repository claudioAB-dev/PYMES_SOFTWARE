import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { memberships, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { AccountantSidebar } from "./components/accountant-sidebar";
import { AccountantHeader } from "./components/accountant-header";

export const dynamic = 'force-dynamic';

export default async function AccountantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Verify if user is an accountant anywhere
    const accountantMemberships = await db.query.memberships.findMany({
        where: and(
            eq(memberships.userId, user.id),
            eq(memberships.role, 'ACCOUNTANT')
        ),
        with: {
            organization: true,
            user: true
        }
    });

    // Removimos la redirección estricta que mandaba de vuelta al dashboard ciegamente 
    // previniendo el infinite loop. El accountant portal en /page.tsx ya maneja el estado vacío.

    const dbUser = await db.query.users.findFirst({
        where: eq(users.id, user.id)
    });

    const organizations = accountantMemberships.map(m => ({
        id: m.organization.id,
        name: m.organization.name
    }));

    const cookieStore = await cookies();
    let activeOrgId = cookieStore.get('axioma_active_org')?.value;

    const isValidOrg = activeOrgId && organizations.some(org => org.id === activeOrgId);

    if ((!activeOrgId || !isValidOrg) && organizations.length > 0) {
        activeOrgId = organizations[0].id;
    }

    return (
        <div className="h-full relative" suppressHydrationWarning>
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900 border-r border-slate-800" suppressHydrationWarning>
                <AccountantSidebar />
            </div>
            <main className="md:pl-72 h-full flex flex-col bg-slate-50/50" suppressHydrationWarning>
                <AccountantHeader
                    userEmail={user.email!}
                    userName={dbUser?.fullName || 'Contador'}
                    organizations={organizations}
                    activeOrgId={activeOrgId}
                />
                <div className="p-8 flex-1 overflow-auto" suppressHydrationWarning>
                    {children}
                </div>
            </main>
        </div>
    );
}
