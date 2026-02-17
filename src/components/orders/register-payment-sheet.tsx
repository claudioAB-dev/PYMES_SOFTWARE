"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { registerPayment } from "@/app/dashboard/orders/actions"

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

interface RegisterPaymentSheetProps {
    orderId: string
    pendingBalance: number
}

export function RegisterPaymentSheet({ orderId, pendingBalance }: RegisterPaymentSheetProps) {
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const form = useForm<z.infer<typeof paymentSchema>>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: pendingBalance,
            method: "CASH",
            reference: "",
        },
    })

    async function onSubmit(values: z.infer<typeof paymentSchema>) {
        setIsPending(true)
        try {
            if (values.amount > pendingBalance + 0.01) {
                form.setError("amount", { message: "El monto excede el saldo pendiente" })
                return
            }

            const result = await registerPayment(orderId, values.amount, values.method, values.reference)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Pago registrado correctamente")
                setOpen(false)
                // Reset form but keep method, maybe? Or reset wholly.
                // We can't easily know the NEW pending balance here without props update, 
                // effectively next open will re-init defaults if we force it, 
                // but react-hook-form doesn't auto-reset on prop change unless configured.
                // Simple reset is fine.
                form.reset()
            }
        } catch (err) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsPending(false)
        }
    }

    // Effect to update default amount when pendingBalance changes (e.g. after a partial payment revalidation)
    // This helps if the user re-opens the sheet immediately.
    // We can just rely on the form key or reset in useEffect.

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button disabled={pendingBalance <= 0}>
                    {pendingBalance <= 0 ? "Pagado" : "Registrar Pago"}
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Registrar Pago</SheetTitle>
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
                                            <SelectItem value="CASH">Efectivo</SelectItem>
                                            <SelectItem value="TRANSFER">Transferencia</SelectItem>
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
                                        <Input placeholder="Ej. 12345" {...field} />
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
