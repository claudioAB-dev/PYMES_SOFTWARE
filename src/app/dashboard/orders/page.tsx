import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { orders, memberships, entities } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Órdenes de Venta</h1>
                <Link href="/dashboard/orders/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Nueva Orden
                    </Button>
                </Link>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Folio</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ordersData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No hay órdenes registradas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            ordersData.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono">{order.id.slice(0, 8)}</TableCell>
                                    <TableCell>{order.entity.commercialName}</TableCell>
                                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={order.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                                            {order.status === 'CONFIRMED' ? 'Confirmado' : 'Borrador'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        ${Number(order.totalAmount).toFixed(2)}
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
