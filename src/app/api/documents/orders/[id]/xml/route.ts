import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { memberships, orders } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { generateCfdi40Xml, XmlOrderData } from "@/lib/xml-generator";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return new NextResponse("Invalid order ID", { status: 400 });
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userMemberships = await db.query.memberships.findMany({
            where: eq(memberships.userId, user.id),
        });

        if (userMemberships.length === 0) {
            return new NextResponse("No organization found", { status: 403 });
        }
        const organizationId = userMemberships[0].organizationId;

        // Fetch Order with relations using db.query
        const order = await db.query.orders.findFirst({
            where: and(
                eq(orders.id, id),
                eq(orders.organizationId, organizationId)
            ),
            with: {
                entity: true,
                items: {
                    with: {
                        product: true,
                    }
                }
            }
        });

        if (!order) {
            return new NextResponse("Order not found", { status: 404 });
        }

        // Calculate Subtotal and Taxes
        let subtotal = 0;
        for (const item of order.items) {
            subtotal += Number(item.quantity) * Number(item.unitPrice);
        }
        const tax = subtotal * 0.16;

        const xmlData: XmlOrderData = {
            id: order.id,
            date: order.createdAt.toISOString(),
            totalAmount: Number(order.totalAmount),
            subtotal: subtotal,
            tax: tax,
            paymentMethod: 'TRANSFER', // Default for XML since it's not saved at order level, it's at payment level.
            entity: {
                commercialName: order.entity?.commercialName || "Desconocido",
                legalName: order.entity?.legalName || null,
                taxId: order.entity?.taxId || null,
                postalCode: order.entity?.postalCode || null,
            },
            items: order.items.map(item => ({
                id: item.id,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                product: {
                    name: item.product.name,
                    uom: item.product.uom,
                }
            }))
        };

        const xmlString = generateCfdi40Xml(xmlData);

        return new NextResponse(xmlString, {
            status: 200,
            headers: {
                "Content-Type": "application/xml",
                "Content-Disposition": `attachment; filename="pre-cfdi-${order.id.slice(0, 8)}.xml"`,
            }
        });

    } catch (error) {
        console.error("Error generating XML:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
