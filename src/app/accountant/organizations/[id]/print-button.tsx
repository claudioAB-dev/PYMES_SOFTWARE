"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
    return (
        <Button onClick={() => window.print()} variant="outline" className="gap-2 border-slate-300 hover:bg-slate-50">
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="font-medium text-slate-700">Imprimir Reporte</span>
        </Button>
    );
}
