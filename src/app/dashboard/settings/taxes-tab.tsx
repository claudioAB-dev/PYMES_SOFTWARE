"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function TaxesTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Impuestos (Taxes)</CardTitle>
                <CardDescription>
                    Configura los impuestos (ej. IVA, Retenciones) aplicables a tus documentos. (Próximamente)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center items-center h-32 border-2 border-dashed rounded-lg bg-slate-50">
                    <div className="text-center">
                        <p className="text-sm text-slate-500 mb-4">No hay impuestos configurados.</p>
                        <Button disabled>Crear Impuesto</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
