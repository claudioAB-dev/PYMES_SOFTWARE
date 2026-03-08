"use client";

import { useTransition, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { completeProductionOrderAction } from "@/app/actions/production-orders";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { CancelOrderButton } from "@/components/manufacturing/CancelOrderButton";
import { useRouter } from "next/navigation";

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

            const result = await completeProductionOrderAction(order.id, quantitiesToSubmit);

            if (result.success) {
                toast.success("Orden completada con éxito");
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

    return (
        <div className="space-y-6">
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
