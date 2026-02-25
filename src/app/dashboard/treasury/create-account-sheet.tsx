"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { createFinancialAccount } from "@/app/dashboard/treasury/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Landmark } from "lucide-react";

const accountSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    type: z.enum(["BANK", "CASH", "CREDIT"], {
        required_error: "Seleccione un tipo de cuenta",
    }),
    currency: z.string().min(3, "Moneda (Ej. MXN, USD)"),
    initialBalance: z.coerce.number(),
});

export function CreateAccountSheet() {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof accountSchema>>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            name: "",
            type: "BANK",
            currency: "MXN",
            initialBalance: 0,
        },
    });

    function onSubmit(values: z.infer<typeof accountSchema>) {
        startTransition(async () => {
            const result = await createFinancialAccount(values);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Cuenta creada exitosamente");
                setOpen(false);
                form.reset();
            }
        });
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline">
                    <Landmark className="mr-2 h-4 w-4" />
                    Nueva Cuenta
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Crear Cuenta Financiera</SheetTitle>
                    <SheetDescription>
                        Añade una nueva cuenta bancaria, caja chica o tarjeta de crédito.
                    </SheetDescription>
                </SheetHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre de Cuenta</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. BBVA Bancomer" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Cuenta</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="BANK">Cuenta Bancaria</SelectItem>
                                            <SelectItem value="CASH">Caja de Efectivo</SelectItem>
                                            <SelectItem value="CREDIT">Tarjeta de Crédito</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Moneda</FormLabel>
                                    <FormControl>
                                        <Input placeholder="MXN, USD, EUR..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="initialBalance"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Saldo Inicial</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="pt-4">
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? "Creando..." : "Crear Cuenta"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
