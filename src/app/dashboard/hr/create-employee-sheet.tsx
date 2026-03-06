"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEmployeeSchema, CreateEmployeeInput } from "@/lib/validators/hr";
import { createEmployee } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

export function CreateEmployeeSheet() {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<CreateEmployeeInput>({
        resolver: zodResolver(createEmployeeSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            taxId: "",
            socialSecurityNumber: "",
            baseSalary: 0,
            paymentPeriod: "BIWEEKLY",
        },
    });

    function onSubmit(data: CreateEmployeeInput) {
        startTransition(async () => {
            const result = await createEmployee(data);

            if (result.error) {
                toast.error(result.error);
            } else {
                setOpen(false);
                form.reset();
                toast.success("Empleado registrado exitosamente");
                router.refresh();
            }
        });
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Empleado
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl flex flex-col h-full w-full">
                <SheetHeader>
                    <SheetTitle>Registrar Empleado</SheetTitle>
                    <SheetDescription>
                        Ingrese los datos del nuevo empleado en la organización.
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-1 py-4 max-h-[calc(100vh-12rem)]">
                    <Form {...form}>
                        <form id="create-employee-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. Juan" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Apellidos *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. Pérez" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="taxId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>RFC (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Opcional" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="socialSecurityNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>NSS (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Opcional" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="baseSalary"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Salario Bruto Base *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
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
                                    name="paymentPeriod"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Periodo de Pago *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona un periodo" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                                                    <SelectItem value="BIWEEKLY">Quincenal</SelectItem>
                                                    <SelectItem value="MONTHLY">Mensual</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </form>
                    </Form>
                </div>

                <div className="sticky bottom-0 border-t bg-background pt-4 pb-2 px-1 flex shrink-0 items-center justify-end gap-2">
                    <SheetClose asChild>
                        <Button type="button" variant="outline" disabled={isPending}>
                            Cancelar
                        </Button>
                    </SheetClose>
                    <Button type="submit" form="create-employee-form" disabled={isPending}>
                        {isPending ? "Guardando..." : "Guardar Empleado"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
