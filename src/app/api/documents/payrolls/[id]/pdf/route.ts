import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { memberships, payrolls, organizations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { renderToStream } from "@react-pdf/renderer";
import { PayrollSlipPdf } from "@/components/documents/PayrollSlipPdf";
import React from "react";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return new NextResponse("Invalid payroll ID", { status: 400 });
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

        const organization = await db.query.organizations.findFirst({
            where: eq(organizations.id, organizationId)
        });

        // Fetch Payroll with relations
        const payroll = await db.query.payrolls.findFirst({
            where: and(
                eq(payrolls.id, id),
                eq(payrolls.organizationId, organizationId)
            ),
            with: {
                employee: true,
            }
        });

        if (!payroll || !organization) {
            return new NextResponse("Payroll not found", { status: 404 });
        }

        // Render PDF to stream
        const pdfStream = await renderToStream(React.createElement(PayrollSlipPdf, { payroll, organization }) as any);

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
                "Content-Disposition": `attachment; filename="recibo-nomina-${payroll.id.slice(0, 8)}.pdf"`,
            }
        });

    } catch (error) {
        console.error("Error generating Payroll PDF:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
