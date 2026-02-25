"use client";

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { PayPayrollDialog } from "@/components/payroll/pay-payroll-dialog";


export type Payroll = {
    id: string;
    employeeId: string;
    organizationId: string;
    periodStart: Date;
    periodEnd: Date;
    grossAmount: string;
    deductions: string;
    netAmount: string;
    status: "DRAFT" | "APPROVED" | "PAID";
    paymentDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    employee: {
        firstName: string;
        lastName: string;
        taxId: string | null;
    };
};

const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value));
}

export const getColumns = (accounts: any[]): ColumnDef<Payroll>[] => [
    {
        accessorKey: "employee",
        header: "Empleado",
        cell: ({ row }) => {
            const payroll = row.original;
            return (
                <div className="font-medium">
                    {payroll.employee.firstName} {payroll.employee.lastName}
                </div>
            )
        }
    },
    {
        accessorKey: "period",
        header: "Periodo",
        cell: ({ row }) => {
            const start = row.original.periodStart;
            const end = row.original.periodEnd;
            return <div className="text-sm">
                {format(new Date(start), "d MMM", { locale: es })} - {format(new Date(end), "d MMM yyyy", { locale: es })}
            </div>;
        },
    },
    {
        accessorKey: "grossAmount",
        header: "Monto Bruto",
        cell: ({ row }) => {
            return <div>{formatCurrency(row.getValue("grossAmount"))}</div>;
        },
    },
    {
        accessorKey: "deductions",
        header: "Deducciones",
        cell: ({ row }) => {
            return <div className="text-red-600">{formatCurrency(row.getValue("deductions"))}</div>;
        },
    },
    {
        accessorKey: "netAmount",
        header: "Monto Neto",
        cell: ({ row }) => {
            return <div className="font-bold text-green-600">{formatCurrency(row.getValue("netAmount"))}</div>;
        },
    },
    {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <Badge variant={status === "PAID" ? "default" : status === "APPROVED" ? "secondary" : "outline"} className={status === "PAID" ? "bg-green-600" : ""}>
                    {status === "PAID" ? "Pagado" : status === "APPROVED" ? "Aprobado" : "Borrador"}
                </Badge>
            );
        },
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const payroll = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <PayPayrollDialog
                            payrollId={payroll.id}
                            employeeName={`${payroll.employee.firstName} ${payroll.employee.lastName}`}
                            netAmount={payroll.netAmount}
                            accounts={accounts}
                            disabled={payroll.status === "PAID"}
                        />
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}

export function PayrollTable<TData, TValue>({
    columns,
    data,
}: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No hay recibos de nómina.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Anterior
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Siguiente
                </Button>
            </div>
        </div>
    );
}
