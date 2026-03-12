import { getSuppliers, getFinancialAccounts } from "./actions";
import { QuickExpenseForm } from "./quick-expense-form";
import { requirePermission } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { memberships } from "@/db/schema";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function NewQuickExpensePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) redirect("/dashboard");
    const organizationId = userMemberships[0].organizationId;

    await requirePermission('manage:quick-expenses', organizationId);

    const [suppliers, accounts] = await Promise.all([
        getSuppliers(),
        getFinancialAccounts()
    ]);

    return (
        <div className="container mx-auto py-6 max-w-3xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Nueva Caja Chica / Gasto Rápido</h1>
            </div>
            <QuickExpenseForm suppliers={suppliers} accounts={accounts} />
        </div>
    );
}
