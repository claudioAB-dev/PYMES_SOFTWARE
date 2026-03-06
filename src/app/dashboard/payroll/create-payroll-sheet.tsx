"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPayrollSchema, CreatePayrollInput } from "@/lib/validators/hr";
import { createPayroll, getEmployees } from "../hr/actions";
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

export function CreatePayrollSheet() {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [employees, setEmployees] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            getEmployees().then(setEmployees);
        }
    }, [open]);

    const form = useForm<CreatePayrollInput>({
        resolver: zodResolver(createPayrollSchema),
        defaultValues: {
            employeeId: "",
            periodStart: new Date(),
            periodEnd: new Date(),
            grossAmount: 0,
            deductions: 0,
        },
    });

    const selectedEmployeeId = form.watch("employeeId");

    // Auto-fill salary based on employee
    useEffect(() => {
        if (selectedEmployeeId && employees.length > 0) {
            const emp = employees.find(e => e.id === selectedEmployeeId);
            if (emp && emp.isActive) {
                form.setValue("grossAmount", Number(emp.baseSalary));
            }
        }
    }, [selectedEmployeeId, employees, form]);

    function onSubmit(data: CreatePayrollInput) {
        startTransition(async () => {
            const result = await createPayroll(data);

            if (result.error) {
                toast.error(result.error);
            } else {
                setOpen(false);
                form.reset();
                toast.success("Nómina guardada en borrador");
            }
        });
    }

    const grossAmount = form.watch("grossAmount") || 0;
    const deductions = form.watch("deductions") || 0;
    const netAmount = Math.max(0, grossAmount - deductions);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button>Generar Nómina</Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl flex flex-col h-full w-full">
                <SheetHeader>
                    <SheetTitle>Generar Recibo de Nómina</SheetTitle>
                    <SheetDescription>
                        Calcula y registra una nueva nómina para un empleado.
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-1 py-4 max-h-[calc(100vh-12rem)]">
                    <Form {...form}>
                        <form id="create-payroll-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="employeeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Empleado *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona un empleado" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {employees.filter(e => e.isActive).map(emp => (
                                                    <SelectItem key={emp.id} value={emp.id}>
                                                        {emp.firstName} {emp.lastName} ({emp.taxId || "Sin RFC"})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="periodStart"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Inicio del Periodo *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    {...field}
                                                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => field.onChange(new Date(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="periodEnd"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fin del Periodo *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    {...field}
                                                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => field.onChange(new Date(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="grossAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Salario Bruto *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    {...field}
                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="deductions"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Deducciones (ISR, IMSS, etc.)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    {...field}
                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="mt-4 p-4 rounded-md bg-muted border">
                                <div className="text-sm font-medium text-muted-foreground mb-1">Total Neto Calculado</div>
                                <div className="text-2xl font-bold text-green-600">
                                    ${netAmount.toFixed(2)} MXN
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>

                <div className="sticky bottom-0 border-t bg-background pt-4 pb-2 px-1 flex shrink-0 items-center justify-end gap-2 mt-auto">
                    <SheetClose asChild>
                        <Button type="button" variant="outline" disabled={isPending}>
                            Cancelar
                        </Button>
                    </SheetClose>
                    <Button type="submit" form="create-payroll-form" disabled={isPending || !selectedEmployeeId}>
                        {isPending ? "Generando..." : "Guardar en Borrador"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
