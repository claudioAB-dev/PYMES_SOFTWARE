import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function MembersTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Miembros del Equipo</CardTitle>
                <CardDescription>
                    Gestiona quién tiene acceso a tu organización.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <p>Esta funcionalidad estará disponible pronto.</p>
                </div>
            </CardContent>
        </Card>
    )
}
