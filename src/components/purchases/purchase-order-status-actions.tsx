"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updatePurchaseOrderStatus } from "@/app/dashboard/purchases/actions"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface PurchaseOrderStatusActionsProps {
    orderId: string
    status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED'
    paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID'
}

export function PurchaseOrderStatusActions({ orderId, status, paymentStatus }: PurchaseOrderStatusActionsProps) {
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    async function handleUpdateStatus(newStatus: 'CONFIRMED' | 'CANCELLED') {
        setIsPending(true)
        try {
            const result = await updatePurchaseOrderStatus(orderId, newStatus)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Orden de compra ${newStatus === 'CONFIRMED' ? 'confirmada' : 'cancelada'} exitosamente`)
                router.refresh()
            }
        } catch (error) {
            toast.error("Error al actualizar el estado")
        } finally {
            setIsPending(false)
        }
    }

    if (status === 'CANCELLED') {
        return (
            <Button
                variant="outline"
                onClick={() => handleUpdateStatus('CONFIRMED')}
                disabled={isPending}
            >
                Reactivar Orden
            </Button>
        )
    }

    return (
        <div className="flex gap-2">
            {status === 'DRAFT' && (
                <Button
                    variant="default"
                    onClick={() => handleUpdateStatus('CONFIRMED')}
                    disabled={isPending}
                >
                    Confirmar Compra
                </Button>
            )}

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isPending || paymentStatus === 'PAID'}>
                        Cancelar Orden
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción cancelará la orden de compra y revertirá el ingreso del inventario para los productos.
                            {paymentStatus !== 'UNPAID' && " Tenga en cuenta que esta orden ya tiene pagos registrados (egresos)."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleUpdateStatus('CANCELLED')}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Confirmar Cancelación
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
