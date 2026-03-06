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

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { toggleEmployeeStatus } from "./actions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Employee = {
    id: string;
    organizationId: string;
    firstName: string;
    lastName: string;
    taxId: string | null;
    socialSecurityNumber: string | null;
    baseSalary: string;
    paymentPeriod: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
    isActive: boolean;
    joinedAt: Date;
    createdAt: Date;
    updatedAt: Date;
};

const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value));
}

const translatePeriod = (period: string) => {
    switch (period) {
        case 'WEEKLY': return 'Semanal';
        case 'BIWEEKLY': return 'Quincenal';
        case 'MONTHLY': return 'Mensual';
        default: return period;
    }
}

export const columns: ColumnDef<Employee>[] = [
    {
        accessorKey: "name",
        header: "Empleado",
        cell: ({ row }) => {
            const employee = row.original;
            return (
                <div className="font-medium text-primary">
                    {employee.firstName} {employee.lastName}
                </div>
            )
        }
    },
    {
        accessorKey: "taxId",
        header: "RFC",
        cell: ({ row }) => {
            const val = row.getValue("taxId");
            return val ? <span className="font-mono text-xs text-muted-foreground">{String(val)}</span> : <span className="text-muted-foreground">-</span>;
        },
    },
    {
        accessorKey: "baseSalary",
        header: "Salario Base",
        cell: ({ row }) => {
            return <div className="font-medium">{formatCurrency(row.getValue("baseSalary"))}</div>;
        },
    },
    {
        accessorKey: "paymentPeriod",
        header: "Periodo",
        cell: ({ row }) => {
            return <Badge variant="outline">{translatePeriod(row.getValue("paymentPeriod") as string)}</Badge>;
        },
    },
    {
        accessorKey: "joinedAt",
        header: "Ingreso",
        cell: ({ row }) => {
            return <span className="text-sm text-muted-foreground">{format(new Date(row.getValue("joinedAt") as string), "dd MMM yyyy", { locale: es })}</span>;
        },
    },
    {
        accessorKey: "isActive",
        header: "Estado",
        cell: ({ row }) => {
            const isActive = row.getValue("isActive") as boolean;
            return (
                <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-600 hover:bg-green-700" : ""}>
                    {isActive ? "Activo" : "Inactivo"}
                </Badge>
            );
        },
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const employee = row.original;
            const router = useRouter();
            const [isPending, startTransition] = useTransition();

            const handleToggleStatus = () => {
                startTransition(async () => {
                    const result = await toggleEmployeeStatus(employee.id, employee.isActive);
                    if (result.error) {
                        toast.error(result.error);
                    } else {
                        toast.success(`Empleado \${employee.isActive ? 'desactivado' : 'activado'} correctamente`);
                        router.refresh();
                    }
                });
            };

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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleToggleStatus}
                            disabled={isPending}
                            className={employee.isActive ? "text-red-600" : "text-green-600"}
                        >
                            {isPending ? "Procesando..." : (employee.isActive ? "Dar de baja (Inactivar)" : "Reactivar empleado")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    }
];

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}

export function EmployeeTable<TData, TValue>({
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
            <div className="rounded-md border overflow-x-auto">
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
                                    No hay empleados registrados.
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
