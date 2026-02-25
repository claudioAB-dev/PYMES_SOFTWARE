"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { registerManualTransaction } from "@/app/dashboard/treasury/actions"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"

const transactionSchema = z.object({
    type: z.enum(["INCOME", "EXPENSE"]),
    category: z.enum(["SALE", "PURCHASE", "PAYROLL", "OPERATING_EXPENSE", "TAX", "CAPITAL"]),
    amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
    accountId: z.string({ required_error: "Seleccione una cuenta" }).uuid(),
    description: z.string().min(3, "La descripción debe tener al menos 3 caracteres"),
})

interface NewTransactionSheetProps {
    accounts: { id: string, name: string, currency: string }[]
}

export function NewTransactionSheet({ accounts }: NewTransactionSheetProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const form = useForm<z.infer<typeof transactionSchema>>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            type: "EXPENSE",
            category: "OPERATING_EXPENSE",
            accountId: accounts.length > 0 ? accounts[0].id : "",
            amount: 0,
            description: "",
        },
    })

    function onSubmit(values: z.infer<typeof transactionSchema>) {
        startTransition(async () => {
            const result = await registerManualTransaction({
                accountId: values.accountId,
                type: values.type,
                category: values.category,
                amount: values.amount,
                description: values.description,
            });

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Transacción registrada correctamente")
                setOpen(false)
                form.reset()
            }
        })
    }

    // Auto-select category based on type
    const type = form.watch("type");

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Transacción
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Registrar Transacción Manual</SheetTitle>
                    <SheetDescription>
                        Registra un ingreso o gasto que no esté ligado a una orden.
                    </SheetDescription>
                </SheetHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo</FormLabel>
                                    <Select onValueChange={(val) => {
                                        field.onChange(val);
                                        if (val === "INCOME") form.setValue("category", "CAPITAL");
                                        else form.setValue("category", "OPERATING_EXPENSE");
                                    }} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione el tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="INCOME">Ingreso</SelectItem>
                                            <SelectItem value="EXPENSE">Egreso</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoría</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione una categoría" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {type === "INCOME" ? (
                                                <>
                                                    <SelectItem value="CAPITAL">Aporte de Capital</SelectItem>
                                                    <SelectItem value="SALE">Ventas (Manual)</SelectItem>
                                                </>
                                            ) : (
                                                <>
                                                    <SelectItem value="OPERATING_EXPENSE">Gasto Operativo (Renta, Luz, etc)</SelectItem>
                                                    <SelectItem value="TAX">Impuestos</SelectItem>
                                                    <SelectItem value="PURCHASE">Compras (Manual)</SelectItem>
                                                    <SelectItem value="PAYROLL">Nómina (Manual)</SelectItem>
                                                </>
                                            )}
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
                                    <FormLabel>Cuenta / Caja</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione una cuenta" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {accounts.map((acc) => (
                                                <SelectItem key={acc.id} value={acc.id}>
                                                    {acc.name} ({acc.currency})
                                                </SelectItem>
                                            ))}
                                            {accounts.length === 0 && (
                                                <SelectItem value="empty" disabled>
                                                    No hay cuentas disponibles
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Motivo de la transacción" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isPending} className="w-full">
                            {isPending ? "Registrando..." : "Confirmar Transacción"}
                        </Button>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
