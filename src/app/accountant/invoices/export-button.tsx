"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportInvoicesToCsv } from "@/app/accountant/actions";
import { toast } from "sonner";

interface ExportButtonProps {
    orgId: string;
}

export function ExportButton({ orgId }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            toast.loading("Generando archivo...", { id: "export-csv" });

            const now = new Date();
            const result = await exportInvoicesToCsv(orgId, {
                month: now.getMonth() + 1,
                year: now.getFullYear()
            });

            if (!result.success || !result.csv) {
                toast.error("Error al generar el archivo", { id: "export-csv" });
                return;
            }

            // Create Blob and trigger download
            const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `invoices_${now.getFullYear()}_${now.getMonth() + 1}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("Descarga iniciada", { id: "export-csv" });
        } catch (error) {
            console.error(error);
            toast.error("Ocurrió un error al exportar", { id: "export-csv" });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExport}
            disabled={isExporting}
        >
            <Download className="h-4 w-4" />
            {isExporting ? "Generando..." : "Exportar mes actual (CSV)"}
        </Button>
    );
}
