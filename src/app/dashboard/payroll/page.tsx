import { getPayrolls } from "../hr/actions";
import { getFinancialAccounts } from "../treasury/actions";
import { PayrollTable, columns } from "./payroll-table";
import { CreatePayrollSheet } from "./create-payroll-sheet";

export const dynamic = 'force-dynamic';

export default async function PayrollPage() {
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

