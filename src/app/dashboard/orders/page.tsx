import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { orders, memberships, entities } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart, FileText, CheckCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateOrderStatus } from "./actions";

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>No autorizado</div>;

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) return <div>No se encontró organización</div>;
    const organizationId = userMemberships[0].organizationId;

    const ordersData = await db.query.orders.findMany({
        where: eq(orders.organizationId, organizationId),
        with: {
            entity: true,
        },
        orderBy: [desc(orders.createdAt)],
    });

    const confirmedOrders = ordersData.filter(o => o.status === 'CONFIRMED');
    const draftOrders = ordersData.filter(o => o.status === 'DRAFT');

    const renderTable = (data: typeof ordersData, statusType: 'CONFIRMED' | 'DRAFT') => (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Folio</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-48 p-0">
                                <EmptyState
                                    icon={ShoppingCart}
                                    title={`No hay ${statusType === 'CONFIRMED' ? 'ventas confirmadas' : 'cotizaciones'}`}
                                    description={statusType === 'CONFIRMED' ? "Crea tu primera orden para comenzar a vender." : "Crea una cotización para enviarla a tu cliente."}
                                />
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-mono">
                                    <Link href={`/dashboard/orders/${order.id}`} className="hover:underline text-blue-600">
                                        {order.id.slice(0, 8)}
                                    </Link>
                                </TableCell>
                                <TableCell>{order.entity?.commercialName || "Cliente Desconocido"}</TableCell>
                                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <div className="flex gap-2 items-center">
                                        <Badge variant={order.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                                            {order.status === 'CONFIRMED' ? 'Confirmado' : 'Borrador'}
                                        </Badge>
                                        {order.paymentStatus === 'PAID' && (
                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200" variant="outline">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Pagado
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    ${Number(order.totalAmount).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" asChild title="Generar PDF">
                                            <a href={`/api/documents/orders/${order.id}/pdf`} target="_blank">
                                                <FileText className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        {order.status === 'DRAFT' && (
                                            <form action={async () => {
                                                "use server";
                                                await updateOrderStatus(order.id, 'CONFIRMED');
                                            }}>
                                                <Button variant="outline" size="sm" type="submit" title="Convertir a Venta">
                                                    <CheckCircle className="mr-2 h-4 w-4" /> Convertir
                                                </Button>
                                            </form>
                                        )}
                                        {order.status === 'CONFIRMED' && order.paymentStatus !== 'PAID' && (
                                            <form action={async () => {
                                                "use server";
                                                const { markOrderAsPaid } = await import('@/app/dashboard/orders/actions');
                                                await markOrderAsPaid(order.id);
                                            }}>
                                                <Button variant="outline" size="sm" type="submit" title="Marcar como Pagado">
                                                    <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" /> Pagado
                                                </Button>
                                            </form>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Ventas y Cotizaciones</h1>
                <Link href="/dashboard/orders/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Nueva Orden
                    </Button>
                </Link>
            </div>

            <Tabs defaultValue="CONFIRMED" className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-4">
                    <TabsTrigger value="CONFIRMED">Ventas Confirmadas</TabsTrigger>
                    <TabsTrigger value="DRAFT">Cotizaciones</TabsTrigger>
                </TabsList>
                <TabsContent value="CONFIRMED" className="mt-0">
                    {renderTable(confirmedOrders, 'CONFIRMED')}
                </TabsContent>
                <TabsContent value="DRAFT" className="mt-0">
                    {renderTable(draftOrders, 'DRAFT')}
                </TabsContent>
            </Tabs>
        </div>
    );
}
