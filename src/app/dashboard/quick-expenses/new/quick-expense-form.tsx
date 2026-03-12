"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createFastPurchaseSchema, CreateFastPurchaseInput } from "@/lib/validators/fast-purchases";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createFastPurchase } from "./actions";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface Supplier {
    id: string;
    commercialName: string;
}

interface FinancialAccount {
    id: string;
    name: string;
}

interface QuickExpenseFormProps {
    suppliers: Supplier[];
    accounts: FinancialAccount[];
}

export function QuickExpenseForm({ suppliers, accounts }: QuickExpenseFormProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    const form = useForm<CreateFastPurchaseInput>({
        resolver: zodResolver(createFastPurchaseSchema) as any,
        defaultValues: {
            concept: "",
            amount: "" as unknown as number,
            date: new Date(),
            entityId: "none",
            accountId: accounts[0]?.id || "",
            requiresCfdi: true,
        },
    });

    const requiresCfdi = form.watch("requiresCfdi") ?? true;
    const amount = form.watch("amount") || 0;
    const taxRate = requiresCfdi ? 0.16 : 0;
    const subtotal = amount / (1 + taxRate);
    const tax = amount - subtotal;

    async function onSubmit(data: CreateFastPurchaseInput) {
        setIsPending(true);
        try {
            const result = await createFastPurchase(data);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Caja Chica registrada correctamente");
                router.push("/dashboard/quick-expenses");
            }
        } catch (error) {
            toast.error("Error al registrar el gasto");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Registro Rápido de Caja Chica</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <FormField
                            control={form.control}
                            name="concept"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Concepto del gasto</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Material de oficina, Taxis, Papelería..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monto Total (MXN)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                placeholder="0.00"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col justify-end">
                                        <FormLabel>Fecha del gasto</FormLabel>
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
                                                            <span>Seleccionar fecha</span>
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="entityId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Proveedor (Opcional)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione proveedor" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">Ninguno (Varios)</SelectItem>
                                                {suppliers.map((s) => (
                                                    <SelectItem key={s.id} value={s.id}>{s.commercialName}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="accountId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Origen del dinero</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione una cuenta" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {accounts.map((acc) => (
                                                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="requiresCfdi"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base text-foreground">Gasto facturable (Requiere CFDI)</FormLabel>
                                        <div className="text-sm text-muted-foreground text-balance">
                                            Desactivarlo para flujos informales/no deducibles.
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex justify-between items-center bg-muted/50 py-4 -mx-0 rounded-b-xl border-t mt-4">
                        <div className="text-sm text-muted-foreground flex items-center gap-4 px-6 relative w-full justify-between">
                            <div>
                                IVA calculado: <span className="font-medium text-foreground">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(tax)}</span>
                            </div>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Registrar Gasto
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
}
