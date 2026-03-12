import { db } from "@/db";
import { productionOrders, memberships } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { OrderDetailsClient } from "./order-details-client"; // Client component import
import { Badge } from "@/components/ui/badge";

async function getOrganizationId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) redirect('/onboarding');

    return { organizationId: userMemberships[0].organizationId };
}

export default async function ProductionOrderDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const { organizationId } = await getOrganizationId();

    const order = await db.query.productionOrders.findFirst({
        where: and(
            eq(productionOrders.id, id),
            eq(productionOrders.organizationId, organizationId)
        ),
        with: {
            product: {
                columns: { name: true, uom: true }
            },
            materials: {
                with: {
                    material: {
                        columns: { name: true, uom: true }
                    }
                }
            },
            batches: true
        }
    });

    if (!order) {
        notFound();
    }

    const statusMap: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
        'draft': { label: 'Borrador', variant: 'secondary' },
        'in_progress': { label: 'En Producción', variant: 'default' },
        'completed': { label: 'Completada', variant: 'outline' }, // success color handle manually if needed
        'cancelled': { label: 'Cancelada', variant: 'destructive' },
    };

    const statusInfo = statusMap[order.status] || { label: order.status, variant: 'secondary' };

    return (
        <div className="container mx-auto py-6 space-y-6 max-w-5xl">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            Orden #{order.id.split('-')[0]}
                            <Badge variant={statusInfo.variant} className={order.status === 'completed' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
                                {statusInfo.label}
                            </Badge>
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            Producto: <span className="font-medium text-foreground">{order.product?.name}</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/30">
                    <div>
                        <p className="text-sm text-muted-foreground font-medium mb-1">Cantidad Objetivo</p>
                        <p className="text-2xl font-bold">{order.targetQuantity} <span className="text-sm font-normal text-muted-foreground">{order.product?.uom}</span></p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium mb-1">Fecha de Inicio</p>
                        <p className="text-sm mt-2">{new Date(order.startDate).toLocaleDateString()}</p>
                    </div>
                    {order.completionDate && (
                        <div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">Fecha de Finalización</p>
                            <p className="text-sm mt-2">{new Date(order.completionDate).toLocaleDateString()}</p>
                        </div>
                    )}
                </div>
            </div>

            <OrderDetailsClient order={order as any} />
        </div>
    );
}
