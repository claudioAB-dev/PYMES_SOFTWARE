import { getPayrolls } from "../hr/actions";
import { getFinancialAccounts } from "../treasury/actions";
import { PayrollTable } from "./payroll-table";
import { CreatePayrollSheet } from "./create-payroll-sheet";

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
                <CreatePayrollSheet />
            </div>

            {/* @ts-ignore */}
            <PayrollTable accounts={accounts} data={payrolls} />
        </div>
    );
}

