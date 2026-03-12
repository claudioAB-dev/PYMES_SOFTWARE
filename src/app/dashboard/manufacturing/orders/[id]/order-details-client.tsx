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

type FormValues = z.infer<typeof formSchema>;

export function OrderDetailsClient({ order }: { order: any }) {
    const isCompleted = order.status === 'completed' || order.status === 'cancelled';
    const [isPending, startTransition] = useTransition();
    const [stockErrors, setStockErrors] = useState<any[] | null>(null);
    const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined);
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

    function onSubmit(data: FormValues) {
        setStockErrors(null);
        startTransition(async () => {
            const quantitiesToSubmit = data.materials.map(m => ({
                materialId: m.materialId,
                quantity: m.actualQuantity,
            }));

            const result = await completeProductionOrderAction(
                order.id,
                quantitiesToSubmit,
                expirationDate ?? null
            );

            if (result.success) {
                toast.success(`Orden completada. Lote ${result.batchNumber} generado e ingresado al almacén.`);
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
                <h3 className="text-xl font-semibold">Consumo de Insumos</h3>
                {!isCompleted && (
                    <div className="flex items-center gap-2">
                        {(order.status === 'draft' || order.status === 'in_progress') && (
                            <CancelOrderButton orderId={order.id} variant="outline" />
                        )}
                        <Button
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            Completar Orden
                        </Button>
                    </div>
                )}
            </div>

            {/* Expiration Date Picker - only shown when order is not completed */}
            {!isCompleted && (
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                    <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Fecha de Caducidad del Lote</p>
                        <p className="text-xs text-muted-foreground">Opcional. Importante para productos perecederos.</p>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-[260px] justify-start text-left font-normal",
                                    !expirationDate && "text-muted-foreground"
                                )}
                                disabled={isPending}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {expirationDate
                                    ? format(expirationDate, "PPP", { locale: es })
                                    : "Seleccionar fecha..."
                                }
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={expirationDate}
                                onSelect={setExpirationDate}
                                disabled={(date) => date < new Date()}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    {expirationDate && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpirationDate(undefined)}
                            className="text-muted-foreground"
                        >
                            Limpiar
                        </Button>
                    )}
                </div>
            )}

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
                    <form onSubmit={form.handleSubmit(onSubmit)}>
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
        </div>
    );
}
