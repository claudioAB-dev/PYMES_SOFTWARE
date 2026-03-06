import { getPayrolls } from "../hr/actions";
import { getFinancialAccounts } from "../treasury/actions";
import { PayrollTable, columns } from "./payroll-table";
import { CreatePayrollSheet } from "./create-payroll-sheet";
import { requirePermission } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export default async function PayrollPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        const userMembership = await db.query.memberships.findFirst({
            where: eq(memberships.userId, user.id),
        });
        if (userMembership) {
            await requirePermission('view:payroll', userMembership.organizationId);
        }
    }

    const [payrolls, accounts] = await Promise.all([
        getPayrolls(),
        getFinancialAccounts()
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Nóminas</h2>
                    <p className="text-muted-foreground">
                        Genera y paga los recibos de nómina de tus empleados.
                    </p>
                </div>
                {/* @ts-ignore */}
                <CreatePayrollSheet />
            </div>

            {/* @ts-ignore */}
            <PayrollTable columns={columns} data={payrolls} financialAccounts={accounts} />
        </div>
    );
}

