"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { payPayroll } from "@/app/dashboard/hr/actions"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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
import { DollarSign } from "lucide-react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

const paymentSchema = z.object({
    method: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"], {
        required_error: "Seleccione un método de pago",
    }),
    accountId: z.string({
        required_error: "Seleccione una cuenta",
    }).uuid(),
    reference: z.string().optional(),
})

interface PayPayrollDialogProps {
    payrollId: string
    employeeName: string
    netAmount: string
    accounts: { id: string, name: string, currency: string, balance: string }[]
    disabled?: boolean
}

export function PayPayrollDialog({ payrollId, employeeName, netAmount, accounts, disabled }: PayPayrollDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const form = useForm<z.infer<typeof paymentSchema>>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            method: "TRANSFER",
            accountId: accounts.length > 0 ? accounts[0].id : "",
            reference: "",
        },
    })

    function onSubmit(values: z.infer<typeof paymentSchema>) {
        startTransition(async () => {
            const result = await payPayroll(payrollId, [{ accountId: values.accountId, amount: Number(netAmount), reference: values.reference }]);
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Nómina pagada correctamente")
                setOpen(false)
                form.reset()
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {/* We use a div styled like DropdownMenuItem instead of real DropdownMenuItem to avoid nesting issues with Dialog */}
                <div
                    className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${disabled ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Registrar Pago
                </div>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pagar Nómina</DialogTitle>
                    <DialogDescription>
                        Registra el pago de <strong>{employeeName}</strong> por la cantidad neta de <strong>${Number(netAmount).toFixed(2)}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
                            name="accountId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cuenta de Origen</FormLabel>
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

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Procesando..." : "Confirmar Pago"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
