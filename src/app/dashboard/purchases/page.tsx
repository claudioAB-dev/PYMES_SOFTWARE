import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { orders, memberships } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { ShoppingBag, Plus } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default async function PurchasesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>No autorizado</div>;

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) return <div>No se encontró organización</div>;
    const organizationId = userMemberships[0].organizationId;

    const purchasesData = await db.query.orders.findMany({
        where: and(
            eq(orders.organizationId, organizationId),
            eq(orders.type, 'PURCHASE')
        ),
        with: {
            entity: true,
        },
        orderBy: [desc(orders.createdAt)],
    });

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Órdenes de Compra</h1>
                <Link href="/dashboard/purchases/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Nueva Compra
                    </Button>
                </Link>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Folio</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Pago</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {purchasesData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-48 p-0">
                                    <EmptyState
                                        icon={ShoppingBag}
                                        title="No hay compras registradas"
                                        description="Crea tu primera orden de compra."
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            purchasesData.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono">
                                        <Link href={`/dashboard/purchases/${order.id}`} className="hover:underline text-blue-600">
                                            {order.id.slice(0, 8)}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{order.entity.commercialName}</TableCell>
                                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={order.status === 'CONFIRMED' ? 'default' : order.status === 'CANCELLED' ? 'destructive' : 'secondary'}>
                                            {order.status === 'CONFIRMED' ? 'Confirmado' : order.status === 'CANCELLED' ? 'Cancelado' : 'Borrador'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={order.paymentStatus === 'PAID' ? 'default' : order.paymentStatus === 'PARTIAL' ? 'secondary' : 'outline'}>
                                            {order.paymentStatus === 'PAID' ? 'Pagado' : order.paymentStatus === 'PARTIAL' ? 'Abonado' : 'Pendiente'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(order.totalAmount))}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
