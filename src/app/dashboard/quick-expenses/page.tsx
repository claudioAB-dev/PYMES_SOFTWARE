import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { orders, memberships } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Receipt, Plus } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { requirePermission } from "@/lib/auth/permissions";

export const dynamic = 'force-dynamic';

export default async function QuickExpensesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>No autorizado</div>;

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) return <div>No se encontró organización</div>;
    const organizationId = userMemberships[0].organizationId;

    await requirePermission('manage:quick-expenses', organizationId);

    const expensesData = await db.query.orders.findMany({
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
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Caja Chica y Gastos</h1>
                    <p className="text-muted-foreground mt-1">Historial de gastos registrados rápidamente.</p>
                </div>
                <Link href="/dashboard/quick-expenses/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Registrar Gasto
                    </Button>
                </Link>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Folio</TableHead>
                            <TableHead>Concepto / Proveedor</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Comprobante</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expensesData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-48 p-0">
                                    <EmptyState
                                        icon={Receipt}
                                        title="No hay gastos registrados"
                                        description="Registra tu primer gasto o salida de caja chica."
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            expensesData.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono text-muted-foreground">
                                        {order.id.slice(0, 8)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{order.concept || "Gasto Regular"}</div>
                                        {order.entity && <div className="text-xs text-muted-foreground">{order.entity.commercialName}</div>}
                                    </TableCell>
                                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        {!order.requiresCfdi && (
                                            <Badge variant="secondary" className="text-muted-foreground">Flujo Interno</Badge>
                                        )}
                                        {order.requiresCfdi && (
                                            <span className="text-muted-foreground text-sm flex items-center gap-1">
                                                <Receipt className="h-3 w-3" /> Ordinario
                                            </span>
                                        )}
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
