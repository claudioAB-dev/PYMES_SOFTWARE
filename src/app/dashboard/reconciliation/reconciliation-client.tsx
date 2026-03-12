"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { FileUploadZone } from "@/components/dashboard/file-upload-zone";
import { Paperclip, ArrowUpRight, ArrowDownRight } from "lucide-react";

type OrderWithEntity = {
    id: string;
    type: "SALE" | "PURCHASE";
    totalAmount: string | null;
    createdAt: Date;
    entity: {
        commercialName: string;
    } | null;
};

interface ReconciliationClientProps {
    orders: OrderWithEntity[];
}

export function ReconciliationClient({ orders }: ReconciliationClientProps) {
    const [selectedOrder, setSelectedOrder] = useState<OrderWithEntity | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const openUploadSheet = (order: OrderWithEntity) => {
        setSelectedOrder(order);
        setIsSheetOpen(true);
    };

    const handleUploadSuccess = () => {
        setIsSheetOpen(false);
        setSelectedOrder(null);
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Cliente / Proveedor</TableHead>
                            <TableHead className="text-right">Monto Total</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No hay facturas pendientes de conciliación.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>
                                        {format(new Date(order.createdAt), "dd MMM yyyy", { locale: es })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={order.type === "SALE" ? "default" : "secondary"} className="flex w-fit items-center gap-1">
                                            {order.type === "SALE" ? (
                                                <><ArrowUpRight className="h-3 w-3" /> Venta</>
                                            ) : (
                                                <><ArrowDownRight className="h-3 w-3" /> Compra</>
                                            )}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {order.entity?.commercialName || "Desconocido"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        ${Number(order.totalAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openUploadSheet(order)}
                                        >
                                            <Paperclip className="h-4 w-4 mr-2" />
                                            Adjuntar CFDI
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-md w-full">
                    <SheetHeader>
                        <SheetTitle>Adjuntar CFDI</SheetTitle>
                        <SheetDescription>
                            Sube los archivos PDF y XML de la factura correspondiente a esta {selectedOrder?.type === "SALE" ? "venta" : "compra"}.
                        </SheetDescription>
                    </SheetHeader>
                    {selectedOrder && (
                        <div className="mt-6 space-y-6">
                            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Entidad:</span>
                                    <span className="font-medium">{selectedOrder.entity?.commercialName || "Desconocido"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Monto:</span>
                                    <span className="font-medium text-primary">
                                        ${Number(selectedOrder.totalAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            <FileUploadZone
                                orderId={selectedOrder.id}
                                transactionType={selectedOrder.type.toLowerCase() as "sale" | "purchase"}
                                onSuccess={handleUploadSuccess}
                            />
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
