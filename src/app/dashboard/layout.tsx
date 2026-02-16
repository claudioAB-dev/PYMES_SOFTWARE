import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { eq } from "drizzle-orm";

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

    // Check if user has any memberships
    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) {
        redirect("/onboarding");
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar/Navbar would go here */}
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
