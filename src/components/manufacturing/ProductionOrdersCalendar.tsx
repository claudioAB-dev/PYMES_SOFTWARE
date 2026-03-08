"use client";

import { useState } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ArrowRight, PackageCheck, CalendarDays, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { CancelOrderButton } from "@/components/manufacturing/CancelOrderButton";

// A basic calendar view mapping orders to days
type Order = {
    id: string;
    targetQuantity: string;
    startDate: Date;
    status: string;
    product: {
        name: string;
        sku: string | null;
        uom: string | null;
    } | null;
};

const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: "Borrador", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200" },
    in_progress: { label: "En Producción", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200" },
    completed: { label: "Completada", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200" },
    cancelled: { label: "Cancelada", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200" },
};

const cardAccent: Record<string, string> = {
    draft: "border-l-yellow-400",
    in_progress: "border-l-blue-500",
    completed: "border-l-green-500",
    cancelled: "border-l-red-400",
};

function OrderCard({ order }: { order: Order }) {
    const [open, setOpen] = useState(false);
    const config = statusConfig[order.status] ?? { label: order.status, className: "bg-muted text-muted-foreground" };
    const canCancel = order.status === "draft" || order.status === "in_progress";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "w-full text-left p-2 text-xs border-l-2 rounded bg-card shadow-sm flex flex-col gap-1",
                        "hover:shadow-md hover:bg-accent/50 transition-all cursor-pointer",
                        cardAccent[order.status] ?? "border-l-border"
                    )}
                >
                    <div className="font-semibold line-clamp-1">{order.product?.name ?? "Desconocido"}</div>
                    <div className="flex justify-between items-center text-muted-foreground">
                        <span>Cant: {Number(order.targetQuantity).toFixed(0)}</span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", config.className)}>
                            {config.label}
                        </span>
                    </div>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" side="right" align="start">
                {/* Header */}
                <div className="p-4 pb-3">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="font-semibold text-sm leading-tight">{order.product?.name ?? "Desconocido"}</p>
                            {order.product?.sku && (
                                <p className="text-xs text-muted-foreground mt-0.5">SKU: {order.product.sku}</p>
                            )}
                        </div>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5", config.className)}>
                            {config.label}
                        </span>
                    </div>
                </div>

                <Separator />

                {/* Details */}
                <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                        <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Cantidad:</span>
                        <span className="font-medium ml-auto">
                            {Number(order.targetQuantity).toFixed(0)}{" "}
                            <span className="text-muted-foreground font-normal">{order.product?.uom ?? ""}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Inicio:</span>
                        <span className="font-medium ml-auto">
                            {format(new Date(order.startDate), "d MMM yyyy", { locale: es })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <PackageCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Orden ID:</span>
                        <span className="font-mono text-xs ml-auto text-muted-foreground">
                            #{order.id.split("-")[0]}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                {canCancel && (
                    <>
                        <Separator />
                        <div className="p-3">
                            <CancelOrderButton
                                orderId={order.id}
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onSuccess={() => setOpen(false)}
                            />
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
}

export function ProductionOrdersCalendar({ orders }: { orders: Order[] }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday

    const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

    const getOrdersForDay = (day: Date) => {
        return orders.filter(o => o.startDate && isSameDay(new Date(o.startDate), day));
    };

    const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
    const prevWeek = () => setCurrentDate(addDays(currentDate, -7));

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="icon" onClick={prevWeek}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="text-lg font-semibold">
                    Semana del {format(days[0], 'd MMM', { locale: es })} al {format(days[6], 'd MMM yyyy', { locale: es })}
                </div>
                <Button variant="outline" size="icon" onClick={nextWeek}>
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 border rounded-md overflow-hidden grid grid-cols-7 divide-x">
                {days.map((day, i) => (
                    <div key={i} className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="p-2 border-b text-center font-medium bg-muted/50">
                            <div className="text-sm text-muted-foreground">{format(day, 'EEEE', { locale: es })}</div>
                            <div className="text-2xl mt-1">{format(day, 'd')}</div>
                        </div>
                        <ScrollArea className="flex-1 p-2">
                            <div className="flex flex-col gap-2">
                                {getOrdersForDay(day).map(order => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                                {getOrdersForDay(day).length === 0 && (
                                    <div className="text-center text-muted-foreground/50 text-xs mt-4">Sin órdenes</div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                ))}
            </div>
        </div>
    );
}
