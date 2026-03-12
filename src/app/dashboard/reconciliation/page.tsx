import { db } from "@/db";
import { orders, memberships } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReconciliationClient } from "./reconciliation-client";

export const metadata = {
    title: "Conciliación | Axioma",
    description: "Buzón de conciliación de facturas (CFDI).",
};

export default async function ReconciliationPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) {
        throw new Error("No organization found");
    }

    const organizationId = userMemberships[0].organizationId;

    // Fetch orders with type SALE or PURCHASE and invoiceStatus pending
    const pendingOrders = await db.query.orders.findMany({
        where: and(
            eq(orders.organizationId, organizationId),
            eq(orders.invoiceStatus, "pending"),
            inArray(orders.status, ["CONFIRMED"]) // Generally, only confirmed orders require invoices
        ),
        with: {
            entity: {
                columns: {
                    commercialName: true,
                }
            },
        },
        orderBy: [desc(orders.createdAt)],
    });

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Conciliación de Facturas</h1>
                    <p className="text-muted-foreground mt-2">
                        Sube los comprobantes fiscales (CFDI) para ventas y compras confirmadas.
                    </p>
                </div>
            </div>

            <ReconciliationClient orders={pendingOrders} />
        </div>
    );
}
