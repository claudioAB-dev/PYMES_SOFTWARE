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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, TrendingUp, FileWarning, Landmark, Receipt, Paperclip, CheckCircle } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { FileUploadZone } from "@/components/dashboard/file-upload-zone";

type OrderWithEntity = {
    id: string;
    type: "SALE" | "PURCHASE";
    totalAmount: string | null;
    createdAt: Date;
    entity: {
        commercialName: string;
    } | null;
};

interface AccountantClientProps {
    pendingSales: OrderWithEntity[];
    pendingPurchases: OrderWithEntity[];
    totalSalesAmount: number;
    totalPurchasesAmount: number;
    commission: number;
}

export function AccountantClient({
    pendingSales,
    pendingPurchases,
    totalSalesAmount,
    totalPurchasesAmount,
    commission
}: AccountantClientProps) {
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

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    };

    const renderTable = (orders: OrderWithEntity[], type: "SALE" | "PURCHASE") => {
        if (orders.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed bg-card/50">
                    <CheckCircle className="h-12 w-12 text-emerald-500/70 mb-4" />
                    <h3 className="text-lg font-medium text-foreground">¡Todo al día!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        No hay {type === "SALE" ? "ingresos" : "egresos"} pendientes de conciliar para este cliente.
                    </p>
                </div>
            );
        }

        return (
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="text-muted-foreground w-[150px]">Fecha</TableHead>
                            <TableHead className="text-muted-foreground">Concepto / Cliente</TableHead>
                            <TableHead className="text-right text-muted-foreground">Monto</TableHead>
                            <TableHead className="text-right text-muted-foreground">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                                <TableCell>
                                    {format(new Date(order.createdAt), "dd MMM yyyy", { locale: es })}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {order.entity?.commercialName || "Desconocido"}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                    {formatCurrency(Number(order.totalAmount || 0))}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openUploadSheet(order)}
                                    >
                                        <Paperclip className="h-4 w-4 mr-2" />
                                        Adjuntar CFDI
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Resumen de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-300">
                            Ventas sin Facturar
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                            {formatCurrency(totalSalesAmount)}
                        </div>
                        <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
                            {pendingSales.length} órdenes huérfanas
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-300">
                            Compras sin Comprobante
                        </CardTitle>
                        <FileWarning className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">
                            {formatCurrency(totalPurchasesAmount)}
                        </div>
                        <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-1">
                            {pendingPurchases.length} compras sin anexar
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                            Comisión del Mes
                        </CardTitle>
                        <Landmark className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(commission)}
                        </div>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                            Cálculo activo en base a tarifa fija ($300)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Firefighting Table */}
            <div className="mt-8">
                <Tabs defaultValue="ingresos" className="w-full">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                            Tabla de Fuego (Huérfanos SAT)
                        </h2>
                        <TabsList>
                            <TabsTrigger value="ingresos" className="data-[state=active]:text-amber-600">
                                <Receipt className="w-4 h-4 mr-2" />
                                Ingresos Pendientes
                            </TabsTrigger>
                            <TabsTrigger value="egresos" className="data-[state=active]:text-rose-600">
                                <Receipt className="w-4 h-4 mr-2" />
                                Egresos Pendientes
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="ingresos">
                        {renderTable(pendingSales, "SALE")}
                    </TabsContent>

                    <TabsContent value="egresos">
                        {renderTable(pendingPurchases, "PURCHASE")}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Upload Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-md w-full">
                    <SheetHeader>
                        <SheetTitle>
                            Conciliar Transacción #{selectedOrder?.id.split('-')[0].toUpperCase()}
                        </SheetTitle>
                        <SheetDescription>
                            Arrastra el PDF y el XML de la factura aquí.
                        </SheetDescription>
                    </SheetHeader>
                    {selectedOrder && (
                        <div className="mt-6 space-y-6">
                            <div className="rounded-lg bg-muted p-4 space-y-3 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Cliente / Proveedor:</span>
                                    <span className="font-medium text-right">{selectedOrder.entity?.commercialName || "Desconocido"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Monto Pendiente:</span>
                                    <span className="font-medium text-primary text-base">
                                        {formatCurrency(Number(selectedOrder.totalAmount || 0))}
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
