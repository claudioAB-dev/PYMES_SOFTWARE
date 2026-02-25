"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function PreferencesTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Preferencias</CardTitle>
                <CardDescription>
                    Configura las opciones regionales como moneda y zona horaria. (Próximamente)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    <div className="text-sm text-slate-500">
                        Configuraciones adicionales estarán disponibles aquí en futuras actualizaciones.
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
