"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createPurchaseOrderSchema, CreatePurchaseOrderInput } from "@/lib/validators/purchases";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { SupplierSelect } from "./supplier-select";
import { PurchaseItemsTable } from "./purchase-items-table";
import { createPurchaseOrder } from "../actions";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

interface Product {
    id: string;
    name: string;
    price: string;
    stock: string;
}

interface Supplier {
    id: string;
    commercialName: string;
}

interface PurchaseOrderFormProps {
    suppliers: Supplier[];
    products: Product[];
}

export function PurchaseOrderForm({ suppliers, products }: PurchaseOrderFormProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    const form = useForm<CreatePurchaseOrderInput>({
        resolver: zodResolver(createPurchaseOrderSchema) as any,
        defaultValues: {
            entityId: "",
            items: [{ productId: "", quantity: 1, price: 0 }],
            status: 'CONFIRMED',
        },
    });

    const items = form.watch("items");
    const subtotal = items?.reduce((sum, item) => {
        return sum + (item.quantity || 0) * (item.price || 0);
    }, 0) || 0;

    const taxRate = 0.16;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    async function onSubmit(data: CreatePurchaseOrderInput) {
        setIsPending(true);
        try {
            const result = await createPurchaseOrder(data);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Orden de compra creada correctamente");
                router.push("/dashboard/purchases");
            }
        } catch (error) {
            toast.error("Error al crear la orden de compra");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Detalles de la Compra</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <SupplierSelect form={form} suppliers={suppliers} />
                            </CardContent>
                        </Card>

                        <PurchaseItemsTable form={form} products={products} />
                    </div>

                    <div className="md:col-span-1">
                        <Card className="sticky top-4">
                            <CardHeader>
                                <CardTitle>Resumen Financiero</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">IVA (16%)</span>
                                    <span>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(tax)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total)}</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" className="w-full" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isPending ? "Procesando..." : "Crear Orden de Compra"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </form>
        </Form>
    );
}
