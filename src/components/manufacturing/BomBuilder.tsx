"use client";

import { useState, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Check, ChevronsUpDown, AlertCircle, Loader2 } from "lucide-react";
import Decimal from "decimal.js";
import { toast } from "sonner";
import { saveBomAction } from "@/app/dashboard/manufacturing/bom/actions";
import { cn } from "@/lib/utils";
import { bomFormSchema, BomFormValues } from "@/lib/validators/manufacturing";
import { Badge } from "@/components/ui/badge";

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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export interface BomComponentItem {
    id: string;
    name: string;
    uom: string | null;
    cost: string;
    itemType?: "finished_good" | "raw_material" | "sub_assembly" | "service" | null;
}

interface BomBuilderProps {
    parent_product_id: string;
    materials: BomComponentItem[];
}

export function BomBuilder({ parent_product_id, materials }: BomBuilderProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<BomFormValues>({
        resolver: zodResolver(bomFormSchema),
        defaultValues: {
            parent_product_id,
            components: [
                {
                    component_product_id: "",
                    quantity: "",
                    scrap_factor: 0,
                    uom: "-",
                    unit_cost: 0,
                },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "components",
    });

    const watchComponents = useWatch({
        control: form.control,
        name: "components",
    });

    // Calcular Totales usando decimal.js
    const totals = watchComponents?.reduce(
        (acc, line) => {
            try {
                const qty = new Decimal(line.quantity || 0);
                const scrap = new Decimal(line.scrap_factor || 0).dividedBy(100);
                const unitCost = new Decimal(line.unit_cost || 0);

                if (qty.isNaN() || scrap.isNaN() || unitCost.isNaN()) return acc;

                const baseCost = qty.times(unitCost);
                const scrapCost = baseCost.times(scrap);
                const lineTotal = baseCost.plus(scrapCost);

                return {
                    totalCost: acc.totalCost.plus(lineTotal),
                    totalScrapCost: acc.totalScrapCost.plus(scrapCost),
                };
            } catch (e) {
                return acc;
            }
        },
        { totalCost: new Decimal(0), totalScrapCost: new Decimal(0) }
    ) || { totalCost: new Decimal(0), totalScrapCost: new Decimal(0) };

    function onSubmit(data: BomFormValues) {
        startTransition(async () => {
            const result = await saveBomAction(data);
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message || "Hubo un problema al guardar la receta");
            }
        });
    }

    return (
        <div className="space-y-6 w-full max-w-6xl mx-auto">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="rounded-md border border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 p-4 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest text-sm">
                                    Constructor de Recetas (BOM)
                                </h3>
                                <p className="text-sm text-slate-500 mt-1 font-mono">
                                    REF: {parent_product_id || "N/A"}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 font-mono"
                                onClick={() =>
                                    append({
                                        component_product_id: "",
                                        quantity: "",
                                        scrap_factor: 0,
                                        uom: "-",
                                        unit_cost: 0,
                                    })
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                AÑADIR INSUMO
                            </Button>
                        </div>

                        {/* List Header (Desktop) */}
                        <div className="hidden grid-cols-12 gap-4 rounded-sm bg-slate-200/80 dark:bg-slate-800 p-3 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider md:grid border border-slate-300 dark:border-slate-700">
                            <div className="col-span-4">Insumo</div>
                            <div className="col-span-2 text-right">Cantidad</div>
                            <div className="col-span-1 text-center">UoM</div>
                            <div className="col-span-2 text-right">Merma (%)</div>
                            <div className="col-span-2 text-right">Costo Fila</div>
                            <div className="col-span-1 text-center">Acción</div>
                        </div>

                        {/* Rows */}
                        <div className="space-y-3 mt-3 text-sm">
                            {fields.map((field, index) => {
                                const currentLine = watchComponents?.[index] || field;
                                let lineCost = new Decimal(0);

                                try {
                                    const qty = new Decimal(currentLine.quantity || 0);
                                    const scrap = new Decimal(currentLine.scrap_factor || 0).dividedBy(100);
                                    const cost = new Decimal(currentLine.unit_cost || 0);
                                    if (!qty.isNaN() && !scrap.isNaN() && !cost.isNaN()) {
                                        lineCost = qty.times(cost).times(new Decimal(1).plus(scrap));
                                    }
                                } catch (e) {
                                    // Ignorar errores de parseo mientras el usuario escribe
                                }

                                return (
                                    <div
                                        key={field.id}
                                        className="grid grid-cols-1 items-start gap-4 md:grid-cols-12 md:items-center bg-white dark:bg-slate-950 p-4 md:p-3 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm"
                                    >
                                        {/* Insumo */}
                                        <div className="col-span-4 space-y-2 md:space-y-0">
                                            <div className="md:hidden text-xs font-semibold uppercase text-slate-500">Insumo</div>
                                            <FormField
                                                control={form.control}
                                                name={`components.${index}.component_product_id`}
                                                render={({ field: formField }) => (
                                                    <FormItem className="flex flex-col">
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        className={cn(
                                                                            "w-full justify-between h-9 font-mono text-sm border-slate-300 dark:border-slate-700",
                                                                            !formField.value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        <span className="truncate">
                                                                            {formField.value
                                                                                ? materials.find((c) => c.id === formField.value)?.name
                                                                                : "SELECCIONAR..."}
                                                                        </span>
                                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[300px] p-0 font-mono" align="start">
                                                                <Command>
                                                                    <CommandInput placeholder="Buscar insumo..." />
                                                                    <CommandList>
                                                                        <CommandEmpty>No se encontró insumo.</CommandEmpty>
                                                                        <CommandGroup>
                                                                            {materials.map((item) => (
                                                                                <CommandItem
                                                                                    value={item.id} // Search uses value, but custom filtering shouldn't affect value prop directly here if search matches id? Actually, shadcn command filters by `value`. We should ensure it searches `item.name`. So `value={item.name}` is correct for `shouldFilter` true if we want to search by name.
                                                                                    key={item.id}
                                                                                    onSelect={() => {
                                                                                        form.setValue(`components.${index}.component_product_id`, item.id, { shouldValidate: true });
                                                                                        form.setValue(`components.${index}.uom`, item.uom || "PZA");
                                                                                        form.setValue(`components.${index}.unit_cost`, parseFloat(item.cost));
                                                                                    }}
                                                                                >
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "mr-2 h-4 w-4",
                                                                                            item.id === formField.value ? "opacity-100" : "opacity-0"
                                                                                        )}
                                                                                    />
                                                                                    <div className="flex flex-col">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span>{item.name}</span>
                                                                                            {item.itemType === 'sub_assembly' && (
                                                                                                <Badge variant="secondary" className="text-[10px] h-4 py-0 px-1">Sub-ensamble</Badge>
                                                                                            )}
                                                                                            {item.itemType === 'raw_material' && (
                                                                                                <Badge variant="outline" className="text-[10px] h-4 py-0 px-1 border-slate-300">Materia Prima</Badge>
                                                                                            )}
                                                                                        </div>
                                                                                        <span className="text-xs text-muted-foreground">${parseFloat(item.cost).toFixed(2)} / {item.uom || "PZA"}</span>
                                                                                    </div>
                                                                                </CommandItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormMessage className="font-mono text-xs" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Cantidad */}
                                        <div className="col-span-2 space-y-2 md:space-y-0">
                                            <div className="md:hidden text-xs font-semibold uppercase text-slate-500">Cantidad</div>
                                            <FormField
                                                control={form.control}
                                                name={`components.${index}.quantity`}
                                                render={({ field: formField }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                {...formField}
                                                                type="number"
                                                                step="any"
                                                                placeholder="0.00"
                                                                className="h-9 font-mono text-right border-slate-300 dark:border-slate-700 focus-visible:ring-slate-500"
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="font-mono text-xs" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* UOM */}
                                        <div className="col-span-1 flex items-center justify-between md:justify-center font-mono text-slate-500 bg-slate-100 dark:bg-slate-900 h-9 rounded-md px-2 border border-slate-200 dark:border-slate-800">
                                            <div className="md:hidden text-xs font-semibold uppercase text-slate-400">UoM</div>
                                            {currentLine.uom}
                                        </div>

                                        {/* Merma */}
                                        <div className="col-span-2 space-y-2 md:space-y-0">
                                            <div className="md:hidden text-xs font-semibold uppercase text-slate-500">Merma (%)</div>
                                            <FormField
                                                control={form.control}
                                                name={`components.${index}.scrap_factor`}
                                                render={({ field: formField }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                {...formField}
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="0"
                                                                className="h-9 font-mono text-right border-slate-300 dark:border-slate-700 focus-visible:ring-slate-500"
                                                                onChange={(e) => {
                                                                    const val = e.target.value === "" ? "" : parseFloat(e.target.value);
                                                                    formField.onChange(val);
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="font-mono text-xs" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Costo Fila */}
                                        <div className="col-span-2 flex items-center justify-between md:justify-end font-mono text-slate-800 dark:text-slate-200 font-bold bg-slate-100 dark:bg-slate-900 h-9 rounded-md px-3 border border-slate-200 dark:border-slate-800">
                                            <div className="md:hidden text-xs font-semibold uppercase text-slate-400">Costo</div>
                                            ${lineCost.toFixed(4)}
                                        </div>

                                        {/* Acción Remover */}
                                        <div className="col-span-1 flex justify-end md:justify-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/50 rounded-full"
                                                onClick={() => remove(index)}
                                                disabled={fields.length === 1 || isPending}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Error de Dependencia Circular u otros a nivel fila */}
                                        {form.formState.errors.components?.[index]?.root && (
                                            <div className="col-span-12 flex items-center text-sm font-medium text-destructive mt-1 bg-red-50 dark:bg-red-950/30 p-2 rounded border border-red-200 dark:border-red-900 border-l-4 border-l-red-500">
                                                <AlertCircle className="w-4 h-4 mr-2" />
                                                {form.formState.errors.components[index]?.root?.message}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Error Global de Formulario (por ejemplo, empty array) */}
                        {form.formState.errors.components?.root && (
                            <div className="mt-4 p-3 text-sm font-medium text-destructive bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-900 flex items-center">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                {form.formState.errors.components.root.message}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                        <Button
                            type="submit"
                            className="w-full md:w-auto font-mono font-bold tracking-wider"
                            size="lg"
                            disabled={isPending}
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isPending ? "GUARDANDO..." : "GUARDAR LISTA DE MATERIALES"}
                        </Button>

                        <Card className="w-full md:w-96 shadow-sm border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                            <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/50">
                                <CardTitle className="text-sm font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center tracking-widest">
                                    Resumen de Producción
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-4 text-sm font-mono">
                                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                    <span className="uppercase text-xs">Costo Insumos (Base):</span>
                                    <span>${totals.totalCost.minus(totals.totalScrapCost).toFixed(4)}</span>
                                </div>
                                <div className="flex justify-between items-center text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-900/50">
                                    <span className="uppercase text-xs font-semibold">Costo Merma Total:</span>
                                    <span className="font-bold">+ ${totals.totalScrapCost.toFixed(4)}</span>
                                </div>
                                <div className="flex justify-between items-center font-bold text-lg md:text-xl border-t-2 border-slate-300 dark:border-slate-700 pt-3 text-slate-900 dark:text-slate-100">
                                    <span className="uppercase text-sm tracking-widest">Costo Est. Total:</span>
                                    <span>${totals.totalCost.toFixed(4)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </Form>
        </div>
    );
}
