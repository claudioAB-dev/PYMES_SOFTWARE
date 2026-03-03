"use client";

import Link from "next/link";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Package, Zap, MoreHorizontal, Pencil, Archive } from "lucide-react";
import { archiveProduct } from "./actions";
import { useTransition } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";

export type Product = {
    id: string;
    name: string;
    sku: string | null;
    type: string;
    price: string;
    cost: string;
    stock: string;
    createdAt: Date;
    organizationId: string;
};

const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value));
}

export const columns: ColumnDef<Product>[] = [
    {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => {
            const product = row.original;
            return (
                <Link href={`/dashboard/products/${product.id}`} className="font-medium hover:underline text-primary">
                    {product.name}
                </Link>
            )
        }
    },
    {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => {
            const sku = row.getValue("sku");
            return sku ? <Badge variant="secondary" className="font-mono text-xs">{String(sku)}</Badge> : <span className="text-muted-foreground text-sm">-</span>;
        },
    },
    {
        accessorKey: "price",
        header: "Precio Venta",
        cell: ({ row }) => {
            return <div className="font-medium text-green-600">{formatCurrency(row.getValue("price"))}</div>;
        },
    },
    {
        accessorKey: "cost",
        header: "Costo",
        cell: ({ row }) => {
            return <div className="font-medium text-muted-foreground">{formatCurrency(row.getValue("cost"))}</div>;
        },
    },
    {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => {
            const type = row.original.type;
            if (type === "SERVICE") return <span className="text-muted-foreground text-sm">N/A</span>;

            const stock = Number(row.getValue("stock"));
            return (
                <Badge variant={stock > 0 ? "outline" : "destructive"}>
                    {stock} pza
                </Badge>
            );
        },
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const product = row.original;
            // eslint-disable-next-line
            const [isPending, startTransition] = useTransition();

            const handleArchive = () => {
                if (confirm("¿Estás seguro de archivar este producto? Dejará de estar disponible para nuevas ventas.")) {
                    startTransition(async () => {
                        const res = await archiveProduct(product.id);
                        if (res && res.error) {
                            toast.error(res.error);
                        } else {
                            toast.success("Producto archivado");
                        }
                    });
                }
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
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/products/${product.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handleArchive}
                            className="text-orange-600 focus:text-orange-500"
                            disabled={isPending}
                        >
                            <Archive className="mr-2 h-4 w-4" />
                            {isPending ? "Archivando..." : "Archivar"}
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

export function ProductTable<TData, TValue>({
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
                                <TableCell colSpan={columns.length} className="h-48 text-center p-0">
                                    <EmptyState
                                        icon={Package}
                                        title="No hay productos"
                                        description="Aún no has registrado ningún producto o servicio."
                                    />
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
