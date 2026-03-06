"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTransition } from "react"
import { toast } from "sonner"
import { uploadCSD } from "./actions"
import { Loader2, ShieldCheck } from "lucide-react"

export function TaxesTab({ organizationId }: { organizationId: string }) {
    const [isPending, startTransition] = useTransition()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!organizationId) return

        const formData = new FormData(e.currentTarget)
        formData.append("organizationId", organizationId)

        startTransition(async () => {
            const result = await uploadCSD(formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Certificados (CSD) cargados correctamente.")
                const form = e.target as HTMLFormElement;
                form.reset();
            }
        })
    }

    return (
        <Card className="max-w-xl">
            <CardHeader>
                <CardTitle>Bóveda CSD (Certificados SAT)</CardTitle>
                <CardDescription>
                    Almacena tus archivos .cer y .key junto con su contraseña para poder emitir y descargar facturas.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <Alert>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>Protege tu Identidad Fiscal</AlertTitle>
                    <AlertDescription>
                        Para emitir facturas, Axioma solo requiere tu <strong>Certificado de Sello Digital (CSD)</strong>.
                        Aunque los archivos se ven iguales, por favor asegúrate de <strong>NO subir tu e.firma (FIEL)</strong>.
                        Tus credenciales del CSD serán cifradas con grado militar (<strong>AES-256</strong>) antes de almacenarse.
                    </AlertDescription>
                </Alert>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="rfc">RFC</Label>
                        <Input id="rfc" name="rfc" type="text" placeholder="Ej. ABC123456T1" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cerFile">Archivo .cer</Label>
                        <Input id="cerFile" name="cerFile" type="file" accept=".cer" required />
                        <p className="text-xs text-muted-foreground">
                            Sube el archivo .cer de tu <strong>Sello Digital (CSD)</strong>. No uses el de tu e.firma.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="keyFile">Archivo .key</Label>
                        <Input id="keyFile" name="keyFile" type="file" accept=".key" required />
                        <p className="text-xs text-muted-foreground">
                            Sube la llave privada .key de tu <strong>Sello Digital</strong>. Este archivo se cifra localmente y nunca se expone.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña CSD</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>

                    <Button type="submit" disabled={isPending || !organizationId} className="w-full sm:w-auto">
                        {isPending
                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cifrando y guardando...</>
                            : <><ShieldCheck className="mr-2 h-4 w-4" /> Cifrar y Guardar Credenciales</>
                        }
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
