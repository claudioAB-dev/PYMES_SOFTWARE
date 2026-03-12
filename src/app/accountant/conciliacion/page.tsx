import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { orders, memberships } from "@/db/schema";
import { and, eq, desc, asc } from "drizzle-orm";
import { AccountantClient } from "./accountant-client";

export const metadata = {
    title: "Portal de Contadores | Axioma",
    description: "Visión general para contadores: facturación pendiente y métricas.",
};

export default async function AccountantDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get active organization (simplified logic for now)
    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
        orderBy: [desc(memberships.createdAt)],
    });

    if (userMemberships.length === 0) {
        throw new Error("No organization found");
    }

    const organizationId = userMemberships[0].organizationId;
    const activeClientsCount = userMemberships.length; // Approximate "Comisión Acumulada" basis

    // 1. Fetch orphaned SALES (Ventas sin Facturar)
    const pendingSales = await db.query.orders.findMany({
        where: and(
            eq(orders.organizationId, organizationId),
            eq(orders.type, "SALE"),
            eq(orders.invoiceStatus, "pending"),
            // Usually only confirmed orders require an invoice
            eq(orders.status, "CONFIRMED")
        ),
        with: {
            entity: {
                columns: {
                    commercialName: true,
                }
            },
        },
        orderBy: [asc(orders.createdAt)], // Oldest to newest (urgency)
    });

    // 2. Fetch orphaned PURCHASES (Compras sin Comprobante)
    const pendingPurchases = await db.query.orders.findMany({
        where: and(
            eq(orders.organizationId, organizationId),
            eq(orders.type, "PURCHASE"),
            eq(orders.invoiceStatus, "pending"),
            eq(orders.requiresCfdi, true),
            eq(orders.status, "CONFIRMED")
        ),
        with: {
            entity: {
                columns: {
                    commercialName: true,
                }
            },
        },
        orderBy: [asc(orders.createdAt)],
    });

    const totalSalesAmount = pendingSales.reduce((acc, order) => acc + Number(order.totalAmount || 0), 0);
    const totalPurchasesAmount = pendingPurchases.reduce((acc, order) => acc + Number(order.totalAmount || 0), 0);
    const commission = activeClientsCount * 300;

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Portal de Contadores</h1>
                    <p className="text-muted-foreground mt-2">
                        Monitorea las facturas pendientes de tus clientes y atiende urgencias rápidamente.
                    </p>
                </div>
            </div>

            <AccountantClient
                pendingSales={pendingSales}
                pendingPurchases={pendingPurchases}
                totalSalesAmount={totalSalesAmount}
                totalPurchasesAmount={totalPurchasesAmount}
                commission={commission}
            />
        </div>
    );
}
