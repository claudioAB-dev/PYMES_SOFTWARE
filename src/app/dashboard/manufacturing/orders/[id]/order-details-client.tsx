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
import { Loader2, CheckCircle2, AlertCircle, CalendarIcon, Package } from "lucide-react";
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

const formSchema = z.object({
    materials: z.array(materialSchema),
});

const batchFormSchema = z.object({
    batchNumber: z.string().min(1, "El número de lote es requerido"),
    manufacturingDate: z.date({
        required_error: "La fecha de fabricación es requerida",
    }),
    expirationDate: z.date().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;
type BatchFormValues = z.infer<typeof batchFormSchema>;

export function OrderDetailsClient({ order }: { order: any }) {
    const isCompleted = order.status === 'completed' || order.status === 'cancelled';
    const [isPending, startTransition] = useTransition();
    const [stockErrors, setStockErrors] = useState<any[] | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const router = useRouter();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            materials: order.materials.map((m: any) => ({
                materialId: m.materialId,
                name: m.material?.name || "Desconocido",
                uom: m.material?.uom || "",
                plannedQuantity: m.plannedQuantity,
                actualQuantity: m.actualQuantity || m.plannedQuantity,
            })),
        },
    });

    const { fields } = useFieldArray({
        name: "materials",
        control: form.control,
    });

    // Helper to generate default batch number
    const generateDefaultBatchNumber = () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const orderSlug = order.id.substring(0, 4).toUpperCase();
        return `LOTE-${yyyy}${mm}${dd}-${orderSlug}`;
    };

    const batchForm = useForm<BatchFormValues>({
        resolver: zodResolver(batchFormSchema),
        defaultValues: {
            batchNumber: generateDefaultBatchNumber(),
            manufacturingDate: new Date(),
            expirationDate: null,
        },
    });

    function onOpenDialogClick() {
        form.handleSubmit(() => {
            // Material form is valid, open the batch dialog
            setIsDialogOpen(true);
        })();
    }

    function onSubmitFinal(batchData: BatchFormValues) {
        setStockErrors(null);
        startTransition(async () => {
            const data = form.getValues();
            const quantitiesToSubmit = data.materials.map(m => ({
                materialId: m.materialId,
                quantity: m.actualQuantity,
            }));

            const result = await completeProductionOrderAction(
                order.id,
                quantitiesToSubmit,
                {
                    batchNumber: batchData.batchNumber,
                    manufacturingDate: batchData.manufacturingDate,
                    expirationDate: batchData.expirationDate ?? null
                }
            );

            if (result.success) {
                toast.success(`Orden completada. Lote ${result.batchNumber} generado e ingresado al almacén.`);
                setIsDialogOpen(false);
                router.refresh();
            } else {
                setIsDialogOpen(false);
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
                <h3 className="text-xl font-semibold">Consumo de Insumos</h3>
                {!isCompleted && (
                    <div className="flex items-center gap-2">
                        {(order.status === 'draft' || order.status === 'in_progress') && (
                            <CancelOrderButton orderId={order.id} variant="outline" />
                        )}
                        <Button
                            type="button"
                            onClick={onOpenDialogClick}
                            disabled={isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Completar Orden
                        </Button>
                    </div>
                )}
            </div>

            {stockErrors && stockErrors.length > 0 && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No se puede completar la orden: Inventario Insuficiente</AlertTitle>
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

            <div className="rounded-md border bg-card">
                <Form {...form}>
                    <form>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Insumo</TableHead>
                                    <TableHead className="w-[150px]">Planeado</TableHead>
                                    <TableHead className="w-[150px]">Real</TableHead>
                                    <TableHead className="w-[100px]">Unidad</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field, index) => (
                                    <TableRow key={field.id}>
                                        <TableCell className="font-medium">
                                            {field.name}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-muted-foreground">
                                                {Number(field.plannedQuantity).toFixed(4)}
                                            </div>
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
                                                                disabled={isCompleted || isPending}
                                                                className={isCompleted ? "bg-muted font-medium border-none shadow-none" : ""}
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
                                        <TableCell>
                                            {field.uom}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {fields.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                            No hay insumos requeridos.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </form>
                </Form>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Trazabilidad del Lote</DialogTitle>
                        <DialogDescription>
                            Ingrese los datos de procedencia del lote generado por esta orden de producción.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...batchForm}>
                        <form onSubmit={batchForm.handleSubmit(onSubmitFinal)} className="space-y-4">
                            <FormField
                                control={batchForm.control}
                                name="batchNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número de Lote</FormLabel>
                                        <FormControl>
                                            <Input placeholder="LOTE-XXXX" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={batchForm.control}
                                name="manufacturingDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Fecha de Fabricación</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
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
                                control={batchForm.control}
                                name="expirationDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Fecha de Caducidad (Opcional)</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
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
                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPending}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Completar y Guardar
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
