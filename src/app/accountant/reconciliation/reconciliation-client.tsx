"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { RefreshCw, FileText, CheckCircle2, AlertTriangle, AlertCircle, PlusCircle, ArrowRightLeft, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import { getReconciliationData, ReconciledItem, ReconciliationState } from "./actions";

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

export function ReconciliationClient() {
    const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [year, setYear] = useState<string>(new Date().getFullYear().toString());
    const [isLoading, setIsLoading] = useState(false);
    const [items, setItems] = useState<ReconciledItem[]>([]);

    const fetchReconciliation = useCallback(async () => {
        setIsLoading(true);
        try {
            const m = parseInt(month);
            const y = parseInt(year);
            const result = await getReconciliationData(m, y);

            if (result.success && result.data) {
                setItems(result.data as ReconciledItem[]);
            } else {
                toast.error(result.error || "Error al cargar los datos.");
            }
        } catch (error) {
            toast.error("Error inesperado al obtener la conciliación.");
        } finally {
            setIsLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchReconciliation();
    }, [fetchReconciliation]);

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
        }).format(amount);
    };

    const getStateBadge = (state: ReconciliationState) => {
        switch (state) {
            case "CONCILIADO":
                return <Badge className="bg-green-500 hover:bg-green-600 border-transparent"><CheckCircle2 className="w-3 h-3 mr-1" /> Conciliado</Badge>;
            case "HUÉRFANO SAT":
                return <Badge className="bg-yellow-500 hover:bg-yellow-600 border-transparent"><AlertTriangle className="w-3 h-3 mr-1" /> Huérfano SAT</Badge>;
            case "HUÉRFANO ERP":
                return <Badge variant="destructive" className="border-transparent"><AlertCircle className="w-3 h-3 mr-1" /> Huérfano ERP</Badge>;
            default:
                return <Badge variant="outline">Desconocido</Badge>;
        }
    };

    const getTypeBadge = (type: string) => {
        if (type === "Ingreso") {
            return <Badge variant="outline" className="text-emerald-700 bg-emerald-50/50 border-emerald-200">Ingreso</Badge>;
        }
        if (type === "Egreso") {
            return <Badge variant="outline" className="text-rose-700 bg-rose-50/50 border-rose-200">Egreso</Badge>;
        }
        return <Badge variant="outline">{type}</Badge>;
    };

    // Derived states
    const conciliados = useMemo(() => items.filter(i => i.state === "CONCILIADO"), [items]);
    const huerfanosSat = useMemo(() => items.filter(i => i.state === "HUÉRFANO SAT"), [items]);
    const huerfanosErp = useMemo(() => items.filter(i => i.state === "HUÉRFANO ERP"), [items]);

    const renderTable = (data: ReconciledItem[], state: ReconciliationState) => {
        return (
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>RFC</TableHead>
                            <TableHead>Entidad</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead>Estado</TableHead>
                            {state === "HUÉRFANO SAT" && <TableHead className="text-right">Acción</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No hay registros para mostrar en esta categoría.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="whitespace-nowrap font-medium text-sm">
                                        {format(new Date(item.date), "dd MMM yyyy", { locale: es })}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {item.rfc}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={item.name}>
                                        {item.name}
                                    </TableCell>
                                    <TableCell>
                                        {getTypeBadge(item.type)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {formatAmount(item.amount)}
                                    </TableCell>
                                    <TableCell>
                                        {getStateBadge(item.state)}
                                    </TableCell>
                                    {state === "HUÉRFANO SAT" && (
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 gap-1"
                                                onClick={() => toast.info(`TODO: Abrir modal para registrar en ERP (SatId: ${item.sourceSatId})`)}
                                            >
                                                <PlusCircle className="w-3 h-3" />
                                                <span className="hidden sm:inline">Crear ERP</span>
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5 text-primary" />
                        Tablero de Conciliación
                    </CardTitle>
                    <CardDescription>
                        Revisa los registros coincidentes y los faltantes en cada plataforma.
                    </CardDescription>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                    <div className="flex gap-2">
                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Mes" />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Año" />
                            </SelectTrigger>
                            <SelectContent>
                                {YEARS.map((y) => (
                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchReconciliation}
                        disabled={isLoading}
                        title="Refrescar"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-6">
                        <TabsTrigger value="all">
                            Todos ({items.length})
                        </TabsTrigger>
                        <TabsTrigger value="conciliado" className="data-[state=active]:text-green-600">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Conciliados ({conciliados.length})
                        </TabsTrigger>
                        <TabsTrigger value="sat" className="data-[state=active]:text-yellow-600">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Huérfanos SAT ({huerfanosSat.length})
                        </TabsTrigger>
                        <TabsTrigger value="erp" className="data-[state=active]:text-red-600">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Huérfanos ERP ({huerfanosErp.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-0 space-y-4">
                        {renderTable(items, "CONCILIADO")}
                    </TabsContent>

                    <TabsContent value="conciliado" className="mt-0 space-y-4">
                        {renderTable(conciliados, "CONCILIADO")}
                    </TabsContent>

                    <TabsContent value="sat" className="mt-0 space-y-4">
                        {renderTable(huerfanosSat, "HUÉRFANO SAT")}
                    </TabsContent>

                    <TabsContent value="erp" className="mt-0 space-y-4">
                        {renderTable(huerfanosErp, "HUÉRFANO ERP")}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
