"use client"

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface RawMaterialWithSupply {
    id: string
    name: string
    sku: string | null
    uom: string | null
    stock: string
    stockInTransit?: number
    nextDeliveryDate?: Date | null
    reservedStock?: number
    isManufacturable?: boolean | null
}

export const columns: ColumnDef<RawMaterialWithSupply>[] = [
    {
        header: "Insumo / UoM",
        cell: ({ row }) => {
            const uom = row.original.uom || "ND";
            return (
                <div>
                    <span className="font-medium text-blue-600 hover:underline">
                        <Link href={`/dashboard/products/${row.original.id}`}>
                            {row.original.name}
                        </Link>
                    </span>
                    {row.original.isManufacturable && (
                        <Badge variant="outline" className="ml-2 bg-indigo-50 text-indigo-700 border-indigo-200">
                            Manufacturable
                        </Badge>
                    )}
                    <br />
                    <span className="text-xs text-muted-foreground">SKU: {row.original.sku || "N/A"} - {uom}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "stock",
        header: () => <div className="text-right">Stock Físico Actual</div>,
        cell: ({ row }) => {
            return (
                <div className="text-right font-mono font-medium">
                    {Number(row.original.stock).toLocaleString()}
                </div>
            )
        },
    },
    {
        accessorKey: "reservedStock",
        header: () => <div className="text-right">Reservado (Producción)</div>,
        cell: ({ row }) => {
            const reserved = row.original.reservedStock || 0;
            return (
                <div className="text-right font-mono text-amber-600 font-medium">
                    {reserved > 0 ? `-${reserved.toLocaleString()}` : "0"}
                </div>
            )
        },
    },
    {
        id: "realAvailable",
        header: () => <div className="text-right">Disponible Real</div>,
        cell: ({ row }) => {
            const physicalStock = Number(row.original.stock);
            const reserved = row.original.reservedStock || 0;
            const realAvailable = physicalStock - reserved;

            return (
                <div className={`text-right font-mono font-bold ${realAvailable <= 0 ? 'text-red-600' : ''}`}>
                    {realAvailable.toLocaleString()}
                </div>
            )
        },
    },
    {
        accessorKey: "stockInTransit",
        header: () => <div className="text-right">Stock en Tránsito</div>,
        cell: ({ row }) => {
            const amount = row.original.stockInTransit || 0;
            return (
                <div className="text-right font-mono text-muted-foreground font-medium">
                    {amount > 0 ? `+${amount.toLocaleString()}` : "0"}
                </div>
            )
        },
    },
    {
        accessorKey: "nextDeliveryDate",
        header: "Próxima Llegada",
        cell: ({ row }) => {
            const date = row.original.nextDeliveryDate;
            const amountInTransit = row.original.stockInTransit || 0;
            const physicalStock = Number(row.original.stock);

            if (amountInTransit > 0 && date) {
                return (
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                        {format(new Date(date), "dd MMM yyyy", { locale: es })}
                    </Badge>
                )
            }

            if (amountInTransit === 0 && physicalStock < 10) {
                return (
                    <Badge variant="destructive">
                        Desabasto
                    </Badge>
                )
            }

            return <span className="text-muted-foreground text-sm">Sin pedidos</span>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            return (
                <div className="text-right flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                        const event = new CustomEvent('edit-raw-material', { detail: row.original });
                        window.dispatchEvent(event);
                    }}>
                        Editar
                    </Button>
                    <Link href={`/dashboard/purchases/new?itemId=${row.original.id}`}>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                            Solicitar Compra <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            )
        }
    }
]

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
}

import { useState, useEffect } from "react"
import { EditRawMaterialSheet } from "./edit-raw-material-sheet"

export function RawMaterialsTable<TData, TValue>({
    columns,
    data,
}: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    const [editOpen, setEditOpen] = useState(false)
    const [editingMaterial, setEditingMaterial] = useState<any>(null)

    useEffect(() => {
        const handleEdit = (e: any) => {
            setEditingMaterial(e.detail)
            setEditOpen(true)
        }
        window.addEventListener('edit-raw-material', handleEdit)
        return () => window.removeEventListener('edit-raw-material', handleEdit)
    }, [])

    return (
        <div className="rounded-md border">
            <EditRawMaterialSheet 
                open={editOpen} 
                onOpenChange={setEditOpen} 
                material={editingMaterial} 
            />
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
                                )
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
                                No hay resultados.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
