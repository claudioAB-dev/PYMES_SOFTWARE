import { getEmployees } from "./actions";
import { EmployeeTable, columns } from "./employee-table";
import { CreateEmployeeSheet } from "./create-employee-sheet";

export const dynamic = 'force-dynamic';

export default async function HRPage() {
    const employees = await getEmployees();

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Recursos Humanos</h2>
                    <p className="text-muted-foreground">
                        Gestiona la nómina y los empleados de tu empresa.
                    </p>
                </div>
                <CreateEmployeeSheet />
            </div>

            {/* @ts-ignore */}
            <EmployeeTable columns={columns} data={employees} />
        </div>
    );
}
