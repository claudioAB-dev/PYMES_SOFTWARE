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
import { AgingReportItem } from "./actions";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

export const columns: ColumnDef<AgingReportItem>[] = [
    {
        accessorKey: "entityName",
        header: "Cliente",
        cell: ({ row }) => (
            <div className="font-medium">
                {row.getValue("entityName")}
                <div className="text-xs text-muted-foreground mt-1">
                    Límite: {formatCurrency(row.original.creditLimit)} | {row.original.creditDays} días
                </div>
            </div>
        )
    },
    {
        accessorKey: "totalPending",
        header: "Saldo Pendiente",
        cell: ({ row }) => <div className="font-bold">{formatCurrency(row.getValue("totalPending"))}</div>
    },
    {
        accessorKey: "current",
        header: "Al Día",
        cell: ({ row }) => {
            const val = row.getValue("current") as number;
            return val > 0 ? <Badge variant="outline" className="text-green-600 bg-green-50">{formatCurrency(val)}</Badge> : "-";
        }
    },
    {
        accessorKey: "days1to30",
        header: "1-30 Días",
        cell: ({ row }) => {
            const val = row.getValue("days1to30") as number;
            return val > 0 ? <Badge variant="outline" className="text-yellow-600 bg-yellow-50">{formatCurrency(val)}</Badge> : "-";
        }
    },
    {
        accessorKey: "days31to60",
        header: "31-60 Días",
        cell: ({ row }) => {
            const val = row.getValue("days31to60") as number;
            return val > 0 ? <Badge variant="outline" className="text-orange-600 bg-orange-50">{formatCurrency(val)}</Badge> : "-";
        }
    },
    {
        accessorKey: "daysOver60",
        header: "> 60 Días",
        cell: ({ row }) => {
            const val = row.getValue("daysOver60") as number;
            return val > 0 ? <Badge variant="destructive">{formatCurrency(val)}</Badge> : "-";
        }
    }
];

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}

export function AgingTable<TData, TValue>({
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
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
                                No hay saldos pendientes.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 py-4 px-4">
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                    Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    Siguiente
                </Button>
            </div>
        </div>
    );
}
