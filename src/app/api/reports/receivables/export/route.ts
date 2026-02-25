import { NextRequest, NextResponse } from "next/server";
import { getReceivablesAging } from "@/app/dashboard/receivables/actions";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const data = await getReceivablesAging();

        // Convert to CSV
        const headers = [
            "Cliente",
            "Limite de Credito",
            "Dias de Credito",
            "Total Pendiente",
            "Al Corriente",
            "1-30 Dias",
            "31-60 Dias",
            "+60 Dias"
        ];

        const rows = data.map(item => [
            `"${item.entityName.replace(/"/g, '""')}"`,
            item.creditLimit.toFixed(2),
            item.creditDays,
            item.totalPending.toFixed(2),
            item.current.toFixed(2),
            item.days1to30.toFixed(2),
            item.days31to60.toFixed(2),
            item.daysOver60.toFixed(2)
        ]);

        // Add BOM for Excel UTF-8 recognition
        const bom = "\uFEFF";
        const csvContent = bom + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="cxc-antiguedad-${new Date().toISOString().slice(0, 10)}.csv"`,
            }
        });
    } catch (error) {
        console.error("Error generating CSV:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
