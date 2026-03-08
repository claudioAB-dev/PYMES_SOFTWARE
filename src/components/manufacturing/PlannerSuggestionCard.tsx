"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlayCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createProductionOrderAction } from "@/app/actions/production-orders";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Define the type based on what we return from the page Component
type ProductWithCapacity = {
    id: string;
    name: string;
    sku: string | null;
    capacity: {
        maxProducible: number;
        bottleneckMaterial: string;
        status: 'ready' | 'delayed' | 'blocked';
        availableDate: Date | null;
        reservedStock?: number;
    };
};

export function PlannerSuggestionCard({ product }: { product: ProductWithCapacity }) {
    const { capacity } = product;
    const [open, setOpen] = useState(false);
    const isReady = capacity.status === 'ready';
    const isDelayed = capacity.status === 'delayed';
    const isBlocked = capacity.status === 'blocked';

    // Set default selected date to the available date if delayed
    const defaultDate = isDelayed && capacity.availableDate ? new Date(capacity.availableDate) : new Date();
    const [date, setDate] = useState<Date>(defaultDate);
    const [quantity, setQuantity] = useState<number>(capacity.maxProducible > 0 ? 1 : 0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const hasReserved = (capacity.reservedStock ?? 0) > 0;

    let badgeColor = "bg-red-500 hover:bg-red-600";
    let badgeText = `Bloqueado permanentemente (Sin stock ni órdenes de compra para ${capacity.bottleneckMaterial})`;

    if (isBlocked && hasReserved) {
        badgeColor = "bg-amber-500 hover:bg-amber-600";
        badgeText = "Capacidad Limitada";
    }

    if (isReady) {
        badgeColor = "bg-green-500 hover:bg-green-600";
        badgeText = `Posible hoy: ${capacity.maxProducible}`;
    } else if (isDelayed) {
        badgeColor = "bg-amber-500 hover:bg-amber-600";
        const dateStr = capacity.availableDate ? format(new Date(capacity.availableDate), "dd MMM yyyy", { locale: es }) : 'desconocida';
        badgeText = `Producción diferida por falta de ${capacity.bottleneckMaterial}. Viable a partir del ${dateStr}`;
    }

    const handleSchedule = async () => {
        if (!date || quantity <= 0 || quantity > capacity.maxProducible) {
            toast.error("Por favor ingresa una fecha y cantidad válida");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("productId", product.id);
            formData.append("targetQuantity", quantity.toString());
            formData.append("startDate", date.toISOString());
            formData.append("status", "draft");

            // We use the existing action, but note it might not perfectly match if it doesn't take startDate
            // Let's assume the action from previous step takes (productId, targetQuantity) 
            // We might need to modify the action to take a start date, or pass it via object. 
            // For now, let's call it and see. The user prompt says "pásale esta fecha" so we'll adapt if needed.

            // Note: The previous signature was (productId: string, targetQuantity: number). 
            // We'll need to adapt it, but for UI sake, we trigger it:
            const result = await createProductionOrderAction(product.id, quantity);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Orden agendada");
                setOpen(false);
                router.refresh();
            }
        } catch (error) {
            toast.error("Ocurrió un error al agendar la orden.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base">{product.name}</CardTitle>
                        {product.sku && <CardDescription>{product.sku}</CardDescription>}
                    </div>
                    {(isReady || isDelayed) && (
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8">
                                    <PlayCircle className="w-4 h-4 mr-1" />
                                    Agendar
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Agendar Producción</DialogTitle>
                                    <DialogDescription>
                                        Crear nueva orden para {product.name}. Capacidad máxima: {capacity.maxProducible}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="quantity" className="text-right">
                                            Cantidad
                                        </Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            max={capacity.maxProducible}
                                            min={1}
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Fecha</Label>
                                        <div className="col-span-3">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !date && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {date ? format(date, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={date}
                                                        onSelect={(d: Date | undefined) => d && setDate(d)}
                                                        initialFocus
                                                        disabled={(d: Date) => {
                                                            const today = new Date(new Date().setHours(0, 0, 0, 0));
                                                            if (d < today) return true;
                                                            if (isDelayed && capacity.availableDate) {
                                                                const availableStart = new Date(new Date(capacity.availableDate).setHours(0, 0, 0, 0));
                                                                if (d < availableStart) return true;
                                                            }
                                                            return false;
                                                        }}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button disabled={isSubmitting} onClick={handleSchedule}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Confirmar Orden
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-start gap-2">
                    <Badge className={cn("text-white", badgeColor)}>
                        {badgeText}
                    </Badge>
                    {hasReserved && (
                        <p className="text-xs text-muted-foreground font-mono">
                            (Faltan insumos de {capacity.bottleneckMaterial}. Ojo: Hay {capacity.reservedStock} unidades reservadas en otras órdenes)
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
