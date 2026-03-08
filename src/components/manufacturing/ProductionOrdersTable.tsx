"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";

type ProductionOrderRow = {
    id: string;
    targetQuantity: string;
    startDate: Date;
    status: string;
    product: {
        name: string;
        uom: string | null;
        sku: string | null;
    } | null;
}

export function ProductionOrdersTable({ orders }: { orders: ProductionOrderRow[] }) {

    const statusMap: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
        'draft': { label: 'Borrador', variant: 'secondary' }, // Gris
        'in_progress': { label: 'En Producción', variant: 'default' }, // Azul (default shadcn primary)
        'completed': { label: 'Completada', variant: 'outline' }, // Verde (handled by classname below)
        'cancelled': { label: 'Cancelada', variant: 'destructive' }, // Rojo
    };

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID de Orden</TableHead>
                        <TableHead>Producto a Fabricar</TableHead>
                        <TableHead className="text-right">Cantidad Objetivo</TableHead>
                        <TableHead>Fecha de Creación</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No hay órdenes de producción registradas.
                            </TableCell>
                        </TableRow>
                    ) : (
                        orders.map((order) => {
                            const statusInfo = statusMap[order.status] || { label: order.status, variant: 'secondary' };
                            const greenClass = order.status === 'completed' ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent' : '';

                            return (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">
                                        #{order.id.split('-')[0]}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{order.product?.name || 'Desconocido'}</span>
                                            {order.product?.sku && (
                                                <span className="text-xs text-muted-foreground">SKU: {order.product.sku}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right whitespace-nowrap">
                                        {Number(order.targetQuantity).toLocaleString()} {order.product?.uom || ''}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(order.startDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={statusInfo.variant} className={greenClass}>
                                            {statusInfo.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/manufacturing/orders/${order.id}`}>
                                            <Button variant="ghost" size="icon">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
