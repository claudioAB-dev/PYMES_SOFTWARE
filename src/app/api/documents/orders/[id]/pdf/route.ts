import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { memberships, orders, payments } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
// We use renderToStream instead of renderToBuffer for Edge/Server compatibility sometimes
import { renderToStream } from "@react-pdf/renderer";
import { OrderPdf } from "@/components/documents/OrderPdf";
import React from "react";

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

        // Fetch Order with relations
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
                },
                payments: {
                    orderBy: [desc(payments.date)],
                },
            }
        });

        if (!order) {
            return new NextResponse("Order not found", { status: 404 });
        }

        // Render PDF to stream
        const pdfStream = await renderToStream(React.createElement(OrderPdf, { order }) as any);

        // Convert stream to readable web stream
        const stream = new ReadableStream({
            start(controller) {
                pdfStream.on('data', (chunk) => {
                    controller.enqueue(new Uint8Array(chunk));
                });
                pdfStream.on('end', () => {
                    controller.close();
                });
                pdfStream.on('error', (err) => {
                    controller.error(err);
                });
            }
        });

        return new NextResponse(stream, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="orden-${order.id.slice(0, 8)}.pdf"`,
            }
        });

    } catch (error) {
        console.error("Error generating PDF:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
