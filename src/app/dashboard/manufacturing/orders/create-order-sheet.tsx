"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createProductionOrderAction } from "@/app/actions/production-orders";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const createOrderSchema = z.object({
    productId: z.string().min(1, "Debes seleccionar un producto a fabricar"),
    targetQuantity: z.coerce.number().positive("La cantidad a producir debe ser mayor a 0"),
});

type FormValues = z.infer<typeof createOrderSchema>;

interface ProductOption {
    id: string;
    name: string;
    sku: string | null;
}

export function CreateOrderSheet({ products }: { products: ProductOption[] }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<FormValues>({
        resolver: zodResolver(createOrderSchema),
        defaultValues: {
            productId: "",
            targetQuantity: 1,
        },
    });

    function onSubmit(data: FormValues) {
        startTransition(async () => {
            const result = await createProductionOrderAction(data.productId, data.targetQuantity);

            if (result.error) {
                toast.error(result.error);
            } else {
                setOpen(false);
                form.reset();
                toast.success("Orden de producción creada");
                // Redirigir a la vista de detalle
                router.push(`/dashboard/manufacturing/orders/${result.orderId}`);
            }
        });
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button>Nueva Orden</Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl flex flex-col h-full w-full">
                <SheetHeader>
                    <SheetTitle>Crear Orden de Producción</SheetTitle>
                    <SheetDescription>
                        Genera una nueva orden para fabricar un producto terminado o sub-ensamble.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-1 py-4 max-h-[calc(100vh-12rem)]">
                    <Form {...form}>
                        <form id="create-order-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <FormField
                                control={form.control}
                                name="productId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Producto a Fabricar *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona un producto..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {products.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.sku ? `[${p.sku}] ` : ""}{p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="targetQuantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cantidad Objetivo *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                placeholder="Ej. 100"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                        </form>
                    </Form>
                </div>

                <div className="sticky bottom-0 border-t bg-background pt-4 pb-2 px-1 flex shrink-0 items-center justify-end gap-2">
                    <SheetClose asChild>
                        <Button type="button" variant="outline" disabled={isPending}>
                            Cancelar
                        </Button>
                    </SheetClose>
                    <Button type="submit" form="create-order-form" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isPending ? "Generando Orden..." : "Crear Orden"}
                    </Button>
                </div>

            </SheetContent>
        </Sheet>
    );
}
