"use client";

import { useTransition, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
    FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { completeProductionOrderAction } from "@/app/actions/production-orders";
import { Loader2, CheckCircle2, AlertCircle, CalendarIcon, Package, Beaker } from "lucide-react";
import { CancelOrderButton } from "@/components/manufacturing/CancelOrderButton";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const materialSchema = z.object({
    materialId: z.string(),
    name: z.string(),
    uom: z.string().nullable(),
    plannedQuantity: z.string(),
    actualQuantity: z.string().min(1, "Requerido"),
});

const completeOrderSchema = z.object({
    materials: z.array(materialSchema),
    batchNumber: z.string().min(1, "El número de lote es requerido"),
    manufacturingDate: z.date({
        required_error: "La fecha de fabricación es requerida",
    }),
    expirationDate: z.date().optional().nullable(),
});

type CompleteOrderValues = z.infer<typeof completeOrderSchema>;

export function OrderDetailsClient({ order }: { order: any }) {
    const isCompleted = order.status === 'completed' || order.status === 'cancelled';
    const [isPending, startTransition] = useTransition();
    const [stockErrors, setStockErrors] = useState<any[] | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const router = useRouter();

    // Helper to generate default batch number
    const generateDefaultBatchNumber = () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const orderSlug = order.id.substring(0, 4).toUpperCase();
        return `LOTE-${yyyy}${mm}${dd}-${orderSlug}`;
    };

    const form = useForm<CompleteOrderValues>({
        resolver: zodResolver(completeOrderSchema),
        defaultValues: {
            materials: order.materials.map((m: any) => ({
                materialId: m.materialId,
                name: m.material?.name || "Desconocido",
                uom: m.material?.uom || "",
                plannedQuantity: m.plannedQuantity,
                actualQuantity: m.actualQuantity || m.plannedQuantity,
            })),
            batchNumber: generateDefaultBatchNumber(),
            manufacturingDate: new Date(),
            expirationDate: null,
        },
    });

    const { fields } = useFieldArray({
        name: "materials",
        control: form.control,
    });

    function onOpenDialog() {
        setStockErrors(null);
        setIsDialogOpen(true);
    }

    function onSubmitFinal(data: CompleteOrderValues) {
        setStockErrors(null);
        startTransition(async () => {
            const quantitiesToSubmit = data.materials.map(m => ({
                materialId: m.materialId,
                quantity: m.actualQuantity,
            }));

            const result = await completeProductionOrderAction(
                order.id,
                quantitiesToSubmit,
                {
                    batchNumber: data.batchNumber,
                    manufacturingDate: data.manufacturingDate,
                    expirationDate: data.expirationDate ?? null
                }
            );

            if (result.success) {
                toast.success(`Orden completada. Lote ${result.batchNumber} generado y enviado a Cuarentena.`);
                setIsDialogOpen(false);
                router.refresh();
            } else {
                if (result.errorType === 'INSUFFICIENT_STOCK' && result.details) {
                    toast.error(result.message);
                    setStockErrors(result.details);
                } else {
                    toast.error(result.error);
                }
            }
        });
    }

    // Get batch info for completed orders
    const batch = order.batches?.[0];

    return (
        <div className="space-y-6">
            {/* Traceability Card for completed orders */}
            {order.status === 'completed' && batch && (
                <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <Package className="h-5 w-5" />
                            Trazabilidad del Lote
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium mb-1">Número de Lote</p>
                                <p className="text-sm font-mono font-bold text-green-700 dark:text-green-400">
                                    {batch.batchNumber}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium mb-1">Fecha de Manufactura</p>
                                <p className="text-sm">
                                    {format(new Date(batch.manufacturingDate), "PPP", { locale: es })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium mb-1">Fecha de Caducidad</p>
                                <p className="text-sm">
                                    {batch.expirationDate
                                        ? format(new Date(batch.expirationDate), "PPP", { locale: es })
                                        : <span className="text-muted-foreground italic">No aplica</span>
                                    }
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium mb-1">Cantidad Inicial</p>
                                <p className="text-sm font-semibold">
                                    {Number(batch.initialQuantity).toFixed(2)} <span className="text-muted-foreground font-normal">{order.product?.uom}</span>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Detalle de Materiales</h3>
                {!isCompleted && (
                    <div className="flex items-center gap-2">
                        {(order.status === 'draft' || order.status === 'in_progress') && (
                            <CancelOrderButton orderId={order.id} variant="outline" />
                        )}
                        <Button
                            type="button"
                            onClick={onOpenDialog}
                            disabled={isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Completar Orden
                        </Button>
                    </div>
                )}
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Insumo</TableHead>
                            <TableHead className="w-[150px]">Cant. Planeada (Teórica)</TableHead>
                            {isCompleted && <TableHead className="w-[150px]">Cant. Real (Consumida)</TableHead>}
                            <TableHead className="w-[100px]">Unidad</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {order.materials.map((m: any) => (
                            <TableRow key={m.materialId}>
                                <TableCell className="font-medium">
                                    {m.material?.name || "Desconocido"}
                                </TableCell>
                                <TableCell>
                                    <div className="text-muted-foreground">
                                        {Number(m.plannedQuantity).toFixed(4)}
                                    </div>
                                </TableCell>
                                {isCompleted && (
                                    <TableCell>
                                        <div className="font-semibold text-green-700 dark:text-green-400">
                                            {Number(m.actualQuantity).toFixed(4)}
                                        </div>
                                    </TableCell>
                                )}
                                <TableCell>
                                    {m.material?.uom}
                                </TableCell>
                            </TableRow>
                        ))}
                        {order.materials.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={isCompleted ? 4 : 3} className="text-center py-6 text-muted-foreground">
                                    No hay insumos requeridos.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Completar Orden y Enviar a Cuarentena</DialogTitle>
                        <DialogDescription>
                            Verifica la cantidad real de insumos consumidos (mermas/ahorros) y define los datos del lote que pasará a Control de Calidad.
                        </DialogDescription>
                    </DialogHeader>

                    {stockErrors && stockErrors.length > 0 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Inventario Insuficiente</AlertTitle>
                            <AlertDescription className="mt-2 text-sm leading-relaxed">
                                <ul className="list-disc list-inside space-y-1">
                                    {stockErrors.map((error, idx) => (
                                        <li key={idx}>
                                            Faltan <span className="font-mono bg-destructive/20 rounded px-1">{Number(error.shortage).toFixed(2)}</span> de <strong>{error.materialName}</strong> / (Stock actual: <span className="font-mono text-muted-foreground">{Number(error.currentStock).toFixed(2)}</span>)
                                        </li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmitFinal)} className="space-y-6">
                            
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 font-medium text-sm text-foreground border-b pb-2">
                                    <Beaker className="h-4 w-4 text-green-600" />
                                    1. Consumo de Materiales (Teórico vs Real)
                                </h4>
                                <div className="rounded-md border bg-card">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Insumo</TableHead>
                                                <TableHead>Teórica</TableHead>
                                                <TableHead className="w-[140px]">Real Consumida</TableHead>
                                                <TableHead>Unidad</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {fields.map((field, index) => (
                                                <TableRow key={field.id}>
                                                    <TableCell className="text-sm font-medium">
                                                        {field.name}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {Number(field.plannedQuantity).toFixed(4)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <FormField
                                                            control={form.control}
                                                            name={`materials.${index}.actualQuantity`}
                                                            render={({ field: inputField }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            step="0.0001"
                                                                            min="0"
                                                                            {...inputField}
                                                                            disabled={isPending}
                                                                            onChange={(e) => {
                                                                                inputField.onChange(e);
                                                                                setStockErrors(null);
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {field.uom}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {fields.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-4 text-xs text-muted-foreground">
                                                        Sin insumos
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 font-medium text-sm text-foreground border-b pb-2">
                                    <Package className="h-4 w-4 text-blue-600" />
                                    2. Datos del Lote Resultante
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="batchNumber"
                                        render={({ field }) => (
                                            <FormItem className="col-span-1 md:col-span-2">
                                                <FormLabel>Número de Lote</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="LOTE-XXXX" {...field} disabled={isPending} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="manufacturingDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Fecha de Fabricación</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                disabled={isPending}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP", { locale: es })
                                                                ) : (
                                                                    <span>Elegir fecha...</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="expirationDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Fecha de Caducidad (Opcional)</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                disabled={isPending}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value ? (
                                                                    format(field.value, "PPP", { locale: es })
                                                                ) : (
                                                                    <span>No aplica</span>
                                                                )}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value || undefined}
                                                            onSelect={field.onChange}
                                                            disabled={(date) => date < new Date()}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="pt-6">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPending}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white">
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Confirmar Consumos y Guardar Lote
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
