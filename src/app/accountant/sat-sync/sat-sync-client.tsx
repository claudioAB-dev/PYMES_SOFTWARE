"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Download, RefreshCw, FileText, CheckCircle2, XCircle, Clock, Loader2, Calendar as CalendarIcon, AlertCircle, PlusCircle, FileCode, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { requestMassiveSync, getSatRequests, requestMockMassiveSync, ConciliationResult, registerMissingCfdi, getOrganizationAccounts } from "./actions";

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
    { value: "1", label: "Enero" }, { value: "2", label: "Febrero" }, { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" }, { value: "5", label: "Mayo" }, { value: "6", label: "Junio" },
    { value: "7", label: "Julio" }, { value: "8", label: "Agosto" }, { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" }, { value: "11", label: "Noviembre" }, { value: "12", label: "Diciembre" },
];

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => y.toString());

export function SatSyncClient({ organizationId }: SatSyncClientProps) {
    const [month, setMonth] = useState<string>("");
    const [year, setYear] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requests, setRequests] = useState<SatRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [conciliationData, setConciliationData] = useState<ConciliationResult[] | null>(null);
    const [registeringRows, setRegisteringRows] = useState<Record<string, boolean>>({});

    const [accounts, setAccounts] = useState<{ id: string, name: string }[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<ConciliationResult | null>(null);
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<'SALE' | 'PURCHASE' | 'PAYROLL' | 'OPERATING_EXPENSE' | 'TAX' | 'CAPITAL' | "">("");

    const fetchRequests = useCallback(async () => {
        try {
            const result = await getSatRequests(organizationId);
            if (result.success && result.data) {
                setRequests(result.data as SatRequest[]);
            }
        } catch (error) {
            console.error("Failed to load requests", error);
        } finally {
            setIsLoading(false);
        }
    }, [organizationId]);

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(() => {
            fetchRequests();
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchRequests]);

    useEffect(() => {
        const handleXmlsProcessed = (event: CustomEvent<ConciliationResult[]>) => {
            setConciliationData(event.detail);
        };
        window.addEventListener('onXmlsProcessed', handleXmlsProcessed as EventListener);
        return () => window.removeEventListener('onXmlsProcessed', handleXmlsProcessed as EventListener);
    }, []);

    useEffect(() => {
        getOrganizationAccounts(organizationId).then(res => {
            if (res.success && res.data) {
                setAccounts(res.data);
            }
        });
    }, [organizationId]);

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

    const handleOpenCapture = (item: ConciliationResult) => {
        setSelectedInvoice(item);
        setSelectedCategory(item.type === 'I' ? 'SALE' : 'OPERATING_EXPENSE');
        if (accounts.length > 0) {
            setSelectedAccountId(accounts[0].id);
        } else {
            setSelectedAccountId("");
        }
    };

    const confirmCapture = async () => {
        if (!selectedInvoice || !organizationId || !selectedAccountId || !selectedCategory) {
            toast.error("Por favor selecciona una cuenta bancaria y categoría.");
            return;
        }

        setRegisteringRows(prev => ({ ...prev, [selectedInvoice.uuid]: true }));
        try {
            const result = await registerMissingCfdi({
                xmlData: selectedInvoice,
                organizationId,
                accountId: selectedAccountId,
                category: selectedCategory
            });
            if (result.success) {
                toast.success(result.message || "Factura registrada y conciliada correctamente.");
                if (conciliationData) {
                    setConciliationData(conciliationData.map(d =>
                        d.uuid === selectedInvoice.uuid ? { ...d, status: 'MATCHED' } : d
                    ));
                }
                setSelectedInvoice(null);
            } else {
                toast.error(result.error || "Error al registrar la factura.");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado al registrar la factura.");
        } finally {
            setRegisteringRows(prev => ({ ...prev, [selectedInvoice.uuid]: false }));
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

    const missingInSystem = conciliationData?.filter(r => r.status === 'MISSING_IN_SYSTEM') || [];
    const missingInSat = conciliationData?.filter(r => r.status === 'MISSING_IN_SAT') || [];
    const matched = conciliationData?.filter(r => r.status === 'MATCHED') || [];

    const totalXmls = conciliationData?.length || 0;
    const totalMatched = matched.length;
    const totalMissingSystem = missingInSystem.length;
    const totalMissingSat = missingInSat.length;

    const ResultsTable = ({ items, showAction }: { items: ConciliationResult[], showAction?: boolean }) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>UUID</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Emisor/Receptor (RFC)</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    {showAction && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={showAction ? 6 : 5} className="text-center text-muted-foreground py-6">
                            No hay resultados en esta categoría.
                        </TableCell>
                    </TableRow>
                ) : (
                    items.map((item, idx) => (
                        <TableRow key={`${item.uuid}-${idx}`} className={showAction ? "bg-red-50/20 hover:bg-red-50/40" : ""}>
                            <TableCell className="font-mono text-xs">{item.uuid.substring(0, 8).toUpperCase()}...</TableCell>
                            <TableCell>{item.issueDate ? format(new Date(item.issueDate), "dd/MM/yyyy", { locale: es }) : "N/A"}</TableCell>
                            <TableCell>{item.type === 'I' ? item.rfc : item.receiverRfc}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={item.type === 'I' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}>
                                    {item.type === 'I' ? 'INGRESO' : item.type === 'E' ? 'EGRESO' : 'OTRO'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(parseFloat(item.total || "0"))}
                            </TableCell>
                            {showAction && (
                                <TableCell className="text-right">
                                    <Button
                                        size="sm"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                        onClick={() => handleOpenCapture(item)}
                                        disabled={registeringRows[item.uuid]}
                                    >
                                        {registeringRows[item.uuid] ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <PlusCircle className="h-4 w-4 mr-2" />
                                        )}
                                        {registeringRows[item.uuid] ? "Capturando..." : "Capturar Factura"}
                                    </Button>
                                </TableCell>
                            )}
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );

    return (
        <div className="space-y-6">
            {conciliationData && (
                <>
                    <h2 className="text-2xl font-bold tracking-tight mb-4">Centro de Mando de Conciliación</h2>

                    {/* Resumen de Procesamiento KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card className="shadow-sm border-border/50">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-full text-primary">
                                    <FileCode className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Total Procesados</p>
                                    <h3 className="text-2xl font-bold">{totalXmls}</h3>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-green-200 bg-green-50/30">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="bg-green-100 p-3 rounded-full text-green-600">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-green-700 font-medium">Conciliados</p>
                                    <h3 className="text-2xl font-bold text-green-700">{totalMatched}</h3>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-red-200 bg-red-50/30">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="bg-red-100 p-3 rounded-full text-red-600">
                                    <AlertCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-red-700 font-medium">Faltantes en Sistema</p>
                                    <h3 className="text-2xl font-bold text-red-700">{totalMissingSystem}</h3>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-yellow-200 bg-yellow-50/30">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                                    <AlertTriangle className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-yellow-700 font-medium">Faltantes en SAT / Canc.</p>
                                    <h3 className="text-2xl font-bold text-yellow-700">{totalMissingSat}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="attention_required" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6 h-auto p-1 bg-muted/50 rounded-lg">
                            <TabsTrigger value="attention_required" className="py-3 text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-red-700 font-medium">
                                Atención Requerida ({totalMissingSystem})
                            </TabsTrigger>
                            <TabsTrigger value="matched" className="py-3 text-base data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-700 font-medium">
                                Documentos Conciliados ({totalMatched})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="attention_required" className="mt-0">
                            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                                <div className="p-4 bg-red-50/50 border-b flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-red-800 text-sm font-medium">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>Facturas encontradas en el XML pero no en Axioma. Su captura es prioritaria.</span>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setConciliationData(null)} className="h-8">Limpiar Todo</Button>
                                </div>
                                <ResultsTable items={missingInSystem} showAction={true} />

                                {missingInSat.length > 0 && (
                                    <div className="mt-8">
                                        <div className="p-4 bg-yellow-50/50 border-y flex items-center gap-2 text-yellow-800 text-sm font-medium">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span>Posibles Cancelados o Faltantes en el SAT ({missingInSat.length})</span>
                                        </div>
                                        <div className="opacity-75">
                                            <ResultsTable items={missingInSat} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="matched" className="mt-0">
                            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                                <div className="p-4 bg-green-50/50 border-b flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Facturas que ya cuadran perfectamente entre el SAT y Axioma.</span>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setConciliationData(null)} className="h-8">Limpiar Todo</Button>
                                </div>
                                <div className="opacity-80">
                                    <ResultsTable items={matched} />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </>
            )}

            {/* Panel de Solicitud */}
            <Card className="border-border/50 shadow-sm mt-8">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Download className="w-5 h-5 text-primary" />
                        Descarga Masiva SAT
                    </CardTitle>
                    <CardDescription>
                        Solicita los XMLs directamente al web service del SAT. La descarga se procesará en segundo plano.
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

            {/* Dialog de Captura Rapida */}
            <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Capturar Factura Faltante</DialogTitle>
                        <DialogDescription>
                            El documento se registrará en módulo de tesorería y se vinculará con este UUID para quedar conciliado.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedInvoice && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-muted-foreground">Monto</Label>
                                <div className="col-span-3 font-semibold text-lg text-primary">
                                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(parseFloat(selectedInvoice.total || "0"))}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right text-muted-foreground">Tipo</Label>
                                <div className="col-span-3">
                                    <Badge variant="outline" className={selectedInvoice.type === 'I' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}>
                                        {selectedInvoice.type === 'I' ? 'INGRESO (Venta / Cobro)' : 'EGRESO (Compra / Gasto)'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="account" className="text-right">Cuenta</Label>
                                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Selecciona la cuenta bancaria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.length === 0 ? (
                                            <SelectItem value="empty" disabled>No hay cuentas configuradas</SelectItem>
                                        ) : (
                                            accounts.map(acc => (
                                                <SelectItem key={acc.id} value={acc.id}>
                                                    {acc.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="category" className="text-right">Categoría</Label>
                                <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val as any)}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Selecciona la categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedInvoice.type === 'I' ? (
                                            <>
                                                <SelectItem value="SALE">Venta Directa</SelectItem>
                                                <SelectItem value="OTHER_INCOME">Otros Ingresos</SelectItem>
                                            </>
                                        ) : (
                                            <>
                                                <SelectItem value="OPERATING_EXPENSE">Gasto Operativo</SelectItem>
                                                <SelectItem value="PURCHASE">Compra de Inventario</SelectItem>
                                                <SelectItem value="PAYROLL">Nómina</SelectItem>
                                                <SelectItem value="TAXES">Impuestos</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedInvoice(null)} disabled={registeringRows[selectedInvoice?.uuid || '']}>
                            Cancelar
                        </Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={confirmCapture}
                            disabled={registeringRows[selectedInvoice?.uuid || '']}
                        >
                            {registeringRows[selectedInvoice?.uuid || ''] ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Registrando...
                                </>
                            ) : (
                                "Confirmar Registro"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
