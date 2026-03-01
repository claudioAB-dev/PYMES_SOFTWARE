"use client";

import { useState } from "react";
import { Server, FileCode, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { uploadManualXML } from "./actions";
import { SatSyncClient } from "./sat-sync-client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SatSyncPage() {
    // En un escenario real, esto vendría del contexto de estado global o sesión del contador
    const organizationId = "UUID-AQUI";
    const [isUploading, setIsUploading] = useState(false);

    async function handleManualUpload(formData: FormData) {
        setIsUploading(true);
        try {
            const result = await uploadManualXML(formData, organizationId);
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado al subir el archivo.");
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Server className="w-8 h-8 text-primary" />
                        Sincronización SAT
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-3xl bg-transparent">
                        Gestiona la descarga masiva de tus XMLs directamente desde los servidores del SAT de forma asíncrona.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <SatSyncClient organizationId={organizationId} />
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card className="flex flex-col sticky top-6 border-border/50 shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <FileCode className="h-5 w-5 text-primary" />
                                <CardTitle className="text-xl">Prueba Manual</CardTitle>
                            </div>
                            <CardDescription>
                                Sube un archivo XML manualmente (CFDI 4.0) para probar el procesamiento y decodificación.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <form id="manual-upload-form" action={handleManualUpload} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="xml-file">Archivo CFDI (.xml)</Label>
                                    <Input
                                        id="xml-file"
                                        name="file"
                                        type="file"
                                        accept=".xml"
                                        required
                                        className="cursor-pointer file:cursor-pointer file:text-primary file:font-semibold"
                                    />
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter>
                            <Button
                                type="submit"
                                form="manual-upload-form"
                                variant="secondary"
                                className="w-full"
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Procesando XML...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Subir XML
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
