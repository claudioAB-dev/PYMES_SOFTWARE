"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateOrderStatus } from "@/app/dashboard/orders/actions"
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

interface OrderStatusActionsProps {
    orderId: string
    status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED'
    paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID'
}

export function OrderStatusActions({ orderId, status, paymentStatus }: OrderStatusActionsProps) {
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    async function handleUpdateStatus(newStatus: 'CONFIRMED' | 'CANCELLED') {
        setIsPending(true)
        try {
            const result = await updateOrderStatus(orderId, newStatus)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Orden ${newStatus === 'CONFIRMED' ? 'confirmada' : 'cancelada'} exitosamente`)
                router.refresh()
            }
        } catch (error) {
            toast.error("Error al actualizar el estado")
        } finally {
            setIsPending(false)
        }
    }

    if (status === 'CANCELLED') {
        return null // No actions for cancelled orders (unless we want to allow reactivating, which is complex)
    }

    return (
        <div className="flex gap-2">
            {status === 'DRAFT' && (
                <Button
                    variant="default"
                    onClick={() => handleUpdateStatus('CONFIRMED')}
                    disabled={isPending}
                >
                    Confirmar Orden
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
                            Esta acción cancelará la orden y restaurará el inventario de los productos.
                            {paymentStatus !== 'UNPAID' && " Tenga en cuenta que esta orden ya tiene pagos registrados."}
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
