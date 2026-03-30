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
import { Users, MoreHorizontal, Link as LinkIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// This type should match the return type of getEntities
// We can infer it or define it manually matching the DB schema
export type Entity = {
    id: string;
    commercialName: string;
    legalName: string | null;
    taxId: string | null;
    type: "CLIENT" | "SUPPLIER" | "BOTH";
    createdAt: Date;
};

export const columns: ColumnDef<Entity>[] = [
    {
        accessorKey: "commercialName",
        header: "Nombre",
    },
    {
        accessorKey: "taxId",
        header: "RFC",
        cell: ({ row }) => row.getValue("taxId") || "N/A",
    },
    {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => {
            const type = row.getValue("type") as string;
            return (
                <Badge variant={type === "CLIENT" ? "default" : type === "SUPPLIER" ? "secondary" : "outline"}>
                    {type === "CLIENT" ? "Cliente" : type === "SUPPLIER" ? "Proveedor" : "Ambos"}
                </Badge>
            );
        },
    },
    // Email column requested but not in DB yet. I'll omit it or show placeholder.
    // {
    //   accessorKey: "email",
    //   header: "Email",
    // },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const entity = row.original;

            const handleCopyLink = () => {
                const url = `${window.location.origin}/portal/${entity.id}`;
                navigator.clipboard.writeText(url);
                toast.success("Enlace copiado al portapapeles");
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
                        <DropdownMenuItem onClick={handleCopyLink}>
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Copiar Enlace del Portal
                        </DropdownMenuItem>
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

export function EntityTable<TData, TValue>({
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
                            <TableCell colSpan={columns.length} className="h-48 text-center p-0">
                                <EmptyState
                                    icon={Users}
                                    title="No hay entidades registradas"
                                    description="Aún no has agregado ningún cliente o proveedor."
                                />
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 py-4 px-4">
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
