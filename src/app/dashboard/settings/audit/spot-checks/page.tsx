"use client";

import { useState } from "react";
import { generateRandomAuditPlan, type SpotCheckItem } from "./actions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Rocket, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Format currency
const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
    }).format(Number(amount));
};

type ChecklistStatus = 'pending' | 'verified' | 'failed';

export default function SpotChecksPage() {
    const [limit, setLimit] = useState<number>(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [auditItems, setAuditItems] = useState<(SpotCheckItem & { status: ChecklistStatus })[] | null>(null);

    const handleGenerate = async () => {
        if (limit < 1 || limit > 50) {
            toast.error("Por favor, ingresa una cantidad válida (1-50).");
            return;
        }

        setIsGenerating(true);
        const { items, error } = await generateRandomAuditPlan(limit);
        setIsGenerating(false);

        if (error) {
            toast.error(error);
            return;
        }

        if (!items || items.length === 0) {
            toast.info("No se encontraron gastos para auditar en esta organización.");
            return;
        }

        // Initialize items with 'pending' status
        setAuditItems(items.map(item => ({ ...item, status: 'pending' })));
        toast.success(`Plan de Auditoría generado con ${items.length} elementos.`);
    };

    const handleVerification = (id: string, newStatus: ChecklistStatus) => {
        if (!auditItems) return;
        setAuditItems(prev => 
            prev!.map(item => item.id === id ? { ...item, status: newStatus } : item)
        );
    };

    // Derived State for the Gamified Card
    const totalItems = auditItems?.length || 0;
    const completedItems = auditItems?.filter(i => i.status !== 'pending').length || 0;
    const verifiedItems = auditItems?.filter(i => i.status === 'verified').length || 0;
    const progressPercentage = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
    
    // Precision only calculated on completed items
    const precisionPercentage = completedItems === 0 ? 0 : Math.round((verifiedItems / completedItems) * 100);

    let semanticColorClass = "text-slate-600";
    let progressColorClass = "bg-primary";
    
    if (completedItems > 0) {
        if (precisionPercentage >= 90) {
            semanticColorClass = "text-emerald-600";
            progressColorClass = "bg-emerald-500";
        } else if (precisionPercentage >= 70) {
            semanticColorClass = "text-yellow-600";
            progressColorClass = "bg-yellow-500";
        } else {
            semanticColorClass = "text-rose-600";
            progressColorClass = "bg-rose-500";
        }
    }

    return (
        <div className="container max-w-4xl mx-auto py-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Auditorías Físicas (Spot Checks)</h2>
                    <p className="text-muted-foreground mt-2">
                        Verifica físicamente en tu planta la existencia real de los gastos registrados.
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/dashboard/settings/audit">Regresar a Bitácora</Link>
                </Button>
            </div>

            {/* Configuration Trigger Panel */}
            {!auditItems && (
                <Card className="border-2 border-dashed border-slate-300 bg-slate-50 dark:bg-slate-900/50">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheck className="w-6 h-6 text-indigo-600" />
                        </div>
                        <CardTitle className="text-xl">Generar Plan de Auditoría Aleatorio</CardTitle>
                        <CardDescription>
                            El sistema seleccionará gastos recientes al azar para que confirmes su existencia física.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4 pt-4">
                        <div className="flex items-center gap-3 w-full max-w-sm justify-center">
                            <span className="text-sm font-medium whitespace-nowrap">Auditar</span>
                            <Input 
                                type="number" 
                                min={1} 
                                max={50} 
                                value={limit} 
                                onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
                                className="w-20 text-center text-lg font-bold"
                            />
                            <span className="text-sm font-medium whitespace-nowrap">gastos al azar</span>
                        </div>
                        <Button 
                            className="w-full max-w-sm" 
                            size="lg" 
                            onClick={handleGenerate} 
                            disabled={isGenerating}
                        >
                            <Rocket className="w-5 h-5 mr-2" />
                            {isGenerating ? "Generando..." : "Iniciar Auditoría de Piso"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Active Audit Session */}
            {auditItems && (
                <div className="space-y-6">
                    {/* The Results / Status Card */}
                    <Card className="shadow-lg sticky top-4 z-10 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-6">
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                            Progreso de Auditoría
                                        </p>
                                        <h3 className="text-2xl font-bold mt-1">
                                            {completedItems} / {totalItems} Completados
                                        </h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                            Precisión Física
                                        </p>
                                        <div className={cn("text-3xl font-extrabold flex items-center justify-end flex-nowrap", semanticColorClass)}>
                                            {precisionPercentage}%
                                            {completedItems > 0 && precisionPercentage < 70 && <AlertCircle className="w-6 h-6 ml-2" />}
                                            {completedItems > 0 && precisionPercentage >= 90 && <ShieldCheck className="w-6 h-6 ml-2" />}
                                        </div>
                                    </div>
                                </div>
                                <Progress 
                                    value={progressPercentage} 
                                    className="h-3"
                                    indicatorClassName={progressColorClass} 
                                />
                                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                                    <span>{verifiedItems} Verificados</span>
                                    <span>{completedItems - verifiedItems} Inconsistencias</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* The Quiz Checklist */}
                    <div className="space-y-4 pb-24">
                        {auditItems.map((item, index) => {
                            const isPending = item.status === 'pending';
                            const isVerified = item.status === 'verified';
                            const isFailed = item.status === 'failed';

                            return (
                                <Card 
                                    key={item.id} 
                                    className={cn(
                                        "transition-all duration-300",
                                        isVerified && "border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/20",
                                        isFailed && "border-rose-200 bg-rose-50/30 dark:bg-rose-950/20"
                                    )}
                                >
                                    <div className="p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded-md">
                                                    #{index + 1}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {format(new Date(item.date), "dd MMM yyyy", { locale: es })}
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-semibold leading-tight mb-1">
                                                {item.description}
                                            </h4>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                                    {formatCurrency(item.amount)}
                                                </span>
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 rounded">
                                                    {item.category.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex w-full md:w-auto gap-2 shrinkage-0">
                                            <Button 
                                                variant={isVerified ? "default" : "outline"}
                                                className={cn(
                                                    "flex-1 md:flex-none h-14 md:h-12 border-2",
                                                    isVerified ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white" : "border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50",
                                                    !isPending && !isVerified && "opacity-50"
                                                )}
                                                onClick={() => handleVerification(item.id, 'verified')}
                                            >
                                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                                <span className="whitespace-nowrap">Verificado</span>
                                            </Button>
                                            
                                            <Button 
                                                variant={isFailed ? "default" : "outline"}
                                                className={cn(
                                                    "flex-1 md:flex-none h-14 md:h-12 border-2",
                                                    isFailed ? "bg-rose-600 hover:bg-rose-700 border-rose-600 text-white" : "border-slate-200 hover:border-rose-500 hover:text-rose-700 hover:bg-rose-50",
                                                    !isPending && !isFailed && "opacity-50"
                                                )}
                                                onClick={() => handleVerification(item.id, 'failed')}
                                            >
                                                <XCircle className="w-5 h-5 mr-2" />
                                                <span className="whitespace-nowrap">No Encontrado</span>
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                    
                    {/* Completion Action */}
                    {completedItems === totalItems && totalItems > 0 && (
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t flex justify-center z-50">
                            <Button size="lg" className="w-full max-w-sm" asChild>
                                <Link href="/dashboard/settings/audit">
                                    <ShieldCheck className="w-5 h-5 mr-2" />
                                    Finalizar Auditoría y Guardar
                                </Link>
                            </Button>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
