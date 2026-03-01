"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Download, RefreshCw, FileText, CheckCircle2, XCircle, Clock, Loader2, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { requestMassiveSync, getSatRequests, requestMockMassiveSync } from "./actions";

export type SatRequest = {
    id: string;
    pacRequestId: string | null;
    periodStart: Date | string | null;
    periodEnd: Date | string | null;
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | null;
    createdAt: Date | string | null;
};

interface SatSyncClientProps {
    organizationId: string;
}

const MONTHS = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
];

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => y.toString());

export function SatSyncClient({ organizationId }: SatSyncClientProps) {
    const [month, setMonth] = useState<string>("");
    const [year, setYear] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requests, setRequests] = useState<SatRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = useCallback(async () => {
        try {
            const result = await getSatRequests(organizationId);
            if (result.success && result.data) {
                setRequests(result.data as SatRequest[]);
            } else {
                console.error(result.error);
            }
        } catch (error) {
            console.error("Failed to load requests", error);
        } finally {
            setIsLoading(false);
        }
    }, [organizationId]);

    useEffect(() => {
        fetchRequests();
        // Poll every 5 seconds per request
        const interval = setInterval(() => {
            fetchRequests();
        }, 5000);

        return () => clearInterval(interval);
    }, [fetchRequests]);

    const onSubmit = async () => {
        if (!month || !year) {
            toast.error("Por favor selecciona un mes y un año.");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await requestMassiveSync(parseInt(month), parseInt(year));
            if (result.success) {
                toast.success(result.message || "Solicitud encolada exitosamente.");
                // Immediately fetch to show the new pending request
                await fetchRequests();
            } else {
                toast.error(result.error || "Error al solicitar la sincronización.");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado al encolar la solicitud.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: SatRequest["status"]) => {
        switch (status) {
            case "PENDING":
                return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-transparent"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>;
            case "PROCESSING":
                return <Badge className="bg-blue-500 hover:bg-blue-600 text-white animate-pulse border-transparent"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Procesando</Badge>;
            case "COMPLETED":
                return <Badge className="bg-green-500 hover:bg-green-600 text-white border-transparent"><CheckCircle2 className="w-3 h-3 mr-1" /> Completado</Badge>;
            case "FAILED":
                return <Badge className="bg-red-500 hover:bg-red-600 text-white border-transparent"><XCircle className="w-3 h-3 mr-1" /> Fallido</Badge>;
            default:
                return <Badge variant="outline" className="text-muted-foreground"><AlertCircle className="w-3 h-3 mr-1" /> Desconocido</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Panel de Solicitud */}
            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Download className="w-5 h-5 text-primary" />
                        Nueva Solicitud de Descarga
                    </CardTitle>
                    <CardDescription>
                        Selecciona el periodo que deseas sincronizar. La descarga se procesará en segundo plano.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="space-y-2 flex-1">
                            <label className="text-sm font-medium">Mes</label>
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un mes" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 flex-1">
                            <label className="text-sm font-medium">Año</label>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un año" />
                                </SelectTrigger>
                                <SelectContent>
                                    {YEARS.map((y) => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                            <Button
                                onClick={onSubmit}
                                disabled={isSubmitting || !month || !year}
                                className="flex-1 sm:flex-none transition-all"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Encolando...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4 mr-2" />
                                        Solicitar Descarga
                                    </>
                                )}
                            </Button>

                            {process.env.NODE_ENV === 'development' && (
                                <Button
                                    onClick={async () => {
                                        setIsSubmitting(true);
                                        try {
                                            const result = await requestMockMassiveSync();
                                            if (result.success) {
                                                toast.success(result.message || "Sandbox encolado exitosamente.");
                                                await fetchRequests();
                                            } else {
                                                toast.error(result.error || "Error al solicitar el Sandbox.");
                                            }
                                        } catch (error) {
                                            toast.error("Ocurrió un error inesperado al encolar el Sandbox.");
                                        } finally {
                                            setIsSubmitting(false);
                                        }
                                    }}
                                    disabled={isSubmitting}
                                    variant="outline"
                                    className="flex-1 sm:flex-none transition-all whitespace-nowrap"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Simular (Sandbox)
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabla de Historial */}
            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Historial de Solicitudes
                    </CardTitle>
                    <CardDescription>
                        Monitorea el estado de tus descargas recientes con el SAT.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Periodo</TableHead>
                                    <TableHead>ID de Solicitud</TableHead>
                                    <TableHead>Fecha de Petición</TableHead>
                                    <TableHead>Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && requests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : requests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No hay solicitudes registradas.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    requests.map((req) => {
                                        const parsedStart = req.periodStart ? new Date(req.periodStart) : null;
                                        const parsedCreated = req.createdAt ? new Date(req.createdAt) : null;

                                        return (
                                            <TableRow key={req.id}>
                                                <TableCell className="font-medium whitespace-nowrap">
                                                    {parsedStart && (
                                                        <div className="flex items-center gap-2">
                                                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                                            <span className="capitalize">{format(parsedStart, "MMM yyyy", { locale: es })}</span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                    {req.id}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {parsedCreated ? format(parsedCreated, "dd/MM/yyyy HH:mm", { locale: es }) : "N/A"}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(req.status)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
