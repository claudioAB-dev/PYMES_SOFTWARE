"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { registerSupplierPayment } from "@/app/dashboard/purchases/actions"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

const paymentSchema = z.object({
    amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
    method: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"], {
        required_error: "Seleccione un método de pago",
    }),
    reference: z.string().optional(),
})

interface RegisterSupplierPaymentSheetProps {
    orderId: string
    pendingBalance: number
}

export function RegisterSupplierPaymentSheet({ orderId, pendingBalance }: RegisterSupplierPaymentSheetProps) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const form = useForm<z.infer<typeof paymentSchema>>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: pendingBalance,
            method: "TRANSFER",
            reference: "",
        },
    })

    async function onSubmit(values: z.infer<typeof paymentSchema>) {
        setIsPending(true)
        try {
            if (values.amount > pendingBalance + 0.01) {
                form.setError("amount", { message: "El monto a pagar excede el saldo pendiente" })
                return
            }

            const result = await registerSupplierPayment(orderId, values.amount, values.method, values.reference)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Pago a proveedor registrado correctamente")
                setOpen(false)
                form.reset()
            }
        } catch (err) {
            toast.error("Ocurrió un error inesperado al registrar el pago")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button disabled={pendingBalance <= 0} variant="outline" className="w-full">
                    {pendingBalance <= 0 ? "Liquidado" : "Registrar Pago a Proveedor"}
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Registrar Pago a Proveedor</SheetTitle>
                    <SheetDescription>
                        Saldo Pendiente: ${pendingBalance.toFixed(2)}
                    </SheetDescription>
                </SheetHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto a Pagar</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="method"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Método de Pago</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione un método" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="TRANSFER">Transferencia</SelectItem>
                                            <SelectItem value="CASH">Efectivo</SelectItem>
                                            <SelectItem value="CARD">Tarjeta</SelectItem>
                                            <SelectItem value="OTHER">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="reference"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Referencia / Folio (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. TR-12345" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" disabled={isPending} className="w-full">
                            {isPending ? "Registrando..." : "Confirmar Pago"}
                        </Button>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
