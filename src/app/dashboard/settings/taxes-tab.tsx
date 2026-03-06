"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTransition, useEffect, useState } from "react"
import { toast } from "sonner"
import { uploadCSD, getCSDStatus } from "./actions"
import { Loader2, ShieldCheck, Lock, AlertTriangle, BadgeCheck, CheckCircle2, Calendar } from "lucide-react"

export function TaxesTab({ organizationId }: { organizationId: string }) {
    const [isPending, startTransition] = useTransition()
    const [status, setStatus] = useState<{ isConfigured: boolean; rfc?: string; updatedAt?: Date | null }>({ isConfigured: false })
    const [isLoading, setIsLoading] = useState(true)
    const [isReplacing, setIsReplacing] = useState(false)

    useEffect(() => {
        if (!organizationId) return
        let mounted = true
        getCSDStatus(organizationId).then((res) => {
            if (!mounted) return
            if (res.isConfigured) {
                setStatus({ isConfigured: true, rfc: res.rfc, updatedAt: res.updatedAt ? new Date(res.updatedAt) : null })
            } else {
                setStatus({ isConfigured: false })
            }
            setIsLoading(false)
        }).catch(() => {
            if (mounted) setIsLoading(false)
        })
        return () => { mounted = false }
    }, [organizationId])

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
                setStatus({
                    isConfigured: true,
                    rfc: formData.get("rfc") as string,
                    updatedAt: new Date()
                })
                setIsReplacing(false)
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

                {/* Security Notice - Premium Design */}
                <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-blue-900/50 dark:from-blue-950/40 dark:to-indigo-950/40">
                    {/* Header row */}
                    <div className="flex items-start gap-3 mb-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow-sm shadow-blue-200 dark:shadow-blue-900">
                            <ShieldCheck className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                                Protege tu Identidad Fiscal
                            </p>
                            <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-0.5 leading-relaxed">
                                Para emitir facturas, Axioma solo requiere tu{" "}
                                <strong className="text-blue-900 dark:text-blue-100">
                                    Certificado de Sello Digital (CSD)
                                </strong>
                                . Tus credenciales se cifran antes de almacenarse y nunca se exponen.
                            </p>
                        </div>
                    </div>

                    {/* Security badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                            <Lock className="h-3 w-3" />
                            Cifrado AES-256
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                            <BadgeCheck className="h-3 w-3" />
                            Grado militar
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                            <ShieldCheck className="h-3 w-3" />
                            Solo CSD, nunca FIEL
                        </span>
                    </div>

                    {/* Warning row */}
                    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800/50 dark:bg-amber-950/40">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <p className="text-xs text-amber-800 dark:text-amber-300 leading-snug">
                            Asegúrate de <strong>NO subir tu e.firma (FIEL)</strong>. Aunque los archivos se ven iguales, son diferentes certificados.
                        </p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Verificando estado del CSD...</p>
                    </div>
                ) : status.isConfigured && !isReplacing ? (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/40">
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
                                    <CheckCircle2 className="h-6 w-6 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
                                        Sello Digital (CSD) Activo y Configurado
                                    </h4>
                                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                        Tus credenciales están protegidas y listas para emitir facturas.
                                    </p>

                                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-6 pt-2">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium">RFC REGISTRADO</span>
                                            <span className="font-mono text-emerald-950 dark:text-emerald-50">{status.rfc}</span>
                                        </div>
                                        {status.updatedAt && (
                                            <div className="flex flex-col">
                                                <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium">ÚLTIMA ACTUALIZACIÓN</span>
                                                <span className="flex items-center gap-1.5 text-emerald-950 dark:text-emerald-50">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {status.updatedAt.toLocaleDateString('es-MX', {
                                                        year: 'numeric', month: 'long', day: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsReplacing(true)}>
                                Reemplazar Credenciales
                            </Button>
                        </div>
                    </div>
                ) : (
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

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button type="submit" disabled={isPending || !organizationId} className="flex-1">
                                {isPending
                                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cifrando y guardando...</>
                                    : <><ShieldCheck className="mr-2 h-4 w-4" /> Cifrar y Guardar Credenciales</>
                                }
                            </Button>
                            {status.isConfigured && isReplacing && (
                                <Button type="button" variant="ghost" disabled={isPending} onClick={() => setIsReplacing(false)} className="flex-none">
                                    Cancelar
                                </Button>
                            )}
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    )
}
