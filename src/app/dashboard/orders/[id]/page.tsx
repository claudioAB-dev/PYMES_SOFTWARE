import { getOrderDetails } from "../actions";
import { DownloadPdfButton } from "@/components/documents/DownloadPdfButton";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RegisterPaymentSheet } from "@/components/orders/register-payment-sheet";
import { OrderStatusActions } from "@/components/orders/order-status-actions";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function OrderDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const order = await getOrderDetails(id);

    if (!order) return notFound();

    // Financial Calculations
    const subtotal = order.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
    const tax = subtotal * 0.16;
    const total = Number(order.totalAmount); // Should match subtotal + tax
    const totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingBalance = total - totalPaid;

    // Status Colors
    const statusVariant =
        order.status === 'CONFIRMED' ? 'default' :
            order.status === 'CANCELLED' ? 'destructive' : 'secondary';

    const paymentStatusColor =
        order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
            order.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                'bg-red-100 text-red-800 hover:bg-red-100';

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Orden #{order.id.slice(0, 8)}</h1>
                    <p className="text-muted-foreground">
                        {format(new Date(order.createdAt), "PPP p", { locale: es })}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                        <Badge variant={statusVariant}>{order.status}</Badge>
                        <Badge className={paymentStatusColor} variant="outline">{order.paymentStatus}</Badge>
                    </div>
                    <div className="flex gap-2">
                        <DownloadPdfButton order={order} />
                        <OrderStatusActions
                            orderId={order.id}
                            status={order.status}
                            paymentStatus={order.paymentStatus}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Items & Payments */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Items Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Productos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="text-right">Cant.</TableHead>
                                        <TableHead className="text-right">P. Unit.</TableHead>
                                        <TableHead className="text-right">Importe</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.product.name}</TableCell>
                                            <TableCell className="text-right">{Number(item.quantity)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(Number(item.quantity) * Number(item.unitPrice))}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Payment History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Pagos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {order.payments.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No hay pagos registrados.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Método</TableHead>
                                            <TableHead>Ref.</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.payments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>{format(new Date(payment.date), "dd/MM/yyyy", { locale: es })}</TableCell>
                                                <TableCell>{payment.method}</TableCell>
                                                <TableCell>{payment.reference || "-"}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Customer & Finances */}
                <div className="space-y-6">

                    {/* Customer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Cliente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p className="font-medium">{order.entity.commercialName}</p>
                                {order.entity.taxId && <p className="text-sm text-muted-foreground">RFC: {order.entity.taxId}</p>}
                                {order.entity.type && <Badge variant="secondary" className="mt-2 text-xs">{order.entity.type}</Badge>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumen Financiero</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>IVA (16%)</span>
                                    <span>{formatCurrency(tax)}</span>
                                </div>
                                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm text-green-700 font-medium">
                                    <span>Pagado</span>
                                    <span>{formatCurrency(totalPaid)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-red-700 font-bold">
                                    <span>Pendiente</span>
                                    <span>{formatCurrency(pendingBalance)}</span>
                                </div>

                                {/* Progress Bar (Simulated with div) */}
                                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mt-2">
                                    <div
                                        className="h-full bg-green-500"
                                        style={{ width: `${Math.min((totalPaid / total) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <RegisterPaymentSheet
                                    orderId={order.id}
                                    pendingBalance={pendingBalance}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
