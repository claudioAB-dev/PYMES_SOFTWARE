"use client";

import { useState, useTransition } from "react";
import { adjustInventory } from "../actions";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calculator } from "lucide-react";

export function AdjustStockDialog({ productId, currentStock }: { productId: string, currentStock: string }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><Calculator className="w-4 h-4 mr-2" /> Ajustar Inventario</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form action={(formData) => {
                    const newStock = Number(formData.get("newStock"));
                    const notes = formData.get("notes") as string;

                    if (isNaN(newStock) || newStock < 0) {
                        toast.error("La cantidad debe ser un número válido y mayor o igual a 0");
                        return;
                    }

                    startTransition(async () => {
                        const res = await adjustInventory(productId, newStock, notes);
                        if (res?.error) {
                            toast.error(res.error);
                        } else {
                            toast.success("Inventario ajustado correctamente");
                            setOpen(false);
                        }
                    });
                }}>
                    <DialogHeader>
                        <DialogTitle>Ajustar Inventario</DialogTitle>
                        <DialogDescription>
                            Realiza un ajuste manual del stock físico. Este movimiento quedará registrado en el Kardex.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">
                                Stock Actual
                            </Label>
                            <span className="col-span-3 font-medium">{currentStock}</span>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="newStock" className="text-right">
                                Nuevo Stock
                            </Label>
                            <Input
                                id="newStock"
                                name="newStock"
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={currentStock}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="notes" className="text-right pt-2">
                                Notas
                            </Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="Motivo del ajuste (ej. Merma, conteo físico)"
                                className="col-span-3"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Guardando..." : "Confirmar Ajuste"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
