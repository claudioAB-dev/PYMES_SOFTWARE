"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cancelProductionOrderAction } from "@/app/actions/production-orders";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CancelOrderButtonProps {
    orderId: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    onSuccess?: () => void;
}

export function CancelOrderButton({
    orderId,
    variant = "destructive",
    size = "default",
    className,
    onSuccess
}: CancelOrderButtonProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleCancel = () => {
        startTransition(async () => {
            const result = await cancelProductionOrderAction(orderId);

            if (result.success) {
                toast.success(result.message);
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.refresh();
                }
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    disabled={isPending}
                    className={className}
                >
                    {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Cancelar Orden
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción cancelará la producción y liberará la materia prima reservada en el almacén.
                        Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Atrás</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleCancel();
                        }}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Sí, cancelar orden
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
