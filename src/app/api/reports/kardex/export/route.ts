import { NextRequest, NextResponse } from "next/server";
import { getProductMovements } from "@/app/dashboard/products/actions";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { products, memberships } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
        return new NextResponse("Product ID is required", { status: 400 });
    }

    try {
        const userMemberships = await db.query.memberships.findMany({
            where: eq(memberships.userId, user.id),
        });

        if (userMemberships.length === 0) return new NextResponse("No org found", { status: 403 });
        const organizationId = userMemberships[0].organizationId;

        // Verify product belongs to org
        const product = await db.query.products.findFirst({
            where: and(
                eq(products.id, productId),
                eq(products.organizationId, organizationId)
            )
        });

        if (!product) return new NextResponse("Product not found", { status: 404 });

        const movements = await getProductMovements(productId);

        const typeLabels: Record<string, string> = {
            'IN_PURCHASE': 'Entrada (Compra)',
            'OUT_SALE': 'Salida (Venta)',
            'IN_RETURN': 'Entrada (Dev / Cancel)',
            'OUT_RETURN': 'Salida (Dev / Cancel)',
            'ADJUSTMENT': 'Ajuste Manual',
        };

        const headers = [
            "Fecha",
            "Tipo",
            "Movimiento",
            "Stock Anterior",
            "Stock Resultante",
            "Notas / Referencia",
            "Usuario"
        ];

        const rows = movements.map(mov => {
            const diff = Number(mov.newStock) - Number(mov.previousStock);
            const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
            const tipo = typeLabels[mov.type] || mov.type;
            const notas = `"${(mov.notes || mov.referenceId || '').replace(/"/g, '""')}"`;
            const usuario = `"${(mov.user?.fullName || mov.user?.email || 'Sistema').replace(/"/g, '""')}"`;

            return [
                format(new Date(mov.createdAt), 'dd/MM/yyyy HH:mm'),
                `"${tipo}"`,
                diffStr,
                mov.previousStock,
                mov.newStock,
                notas,
                usuario
            ];
        });

        const bom = "\uFEFF";
        const csvContent = bom + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="kardex-${product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv"`,
            }
        });
    } catch (error) {
        console.error("Error generating Kardex CSV:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
