"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CreateOrderInput } from "@/lib/validators/orders";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createQuickClient } from "../actions";
import { PlusCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Client {
    id: string;
    commercialName: string;
}

interface ClientSelectProps {
    form: UseFormReturn<CreateOrderInput>;
    clients: Client[];
}

export function ClientSelect({ form, clients }: ClientSelectProps) {
    const [localClients, setLocalClients] = useState<Client[]>(clients);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newClientData, setNewClientData] = useState({ commercialName: "", taxId: "" });
    const [isSelectOpen, setIsSelectOpen] = useState(false);

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClientData.commercialName) {
            toast.error("El nombre comercial es obligatorio");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createQuickClient({
                commercialName: newClientData.commercialName,
                taxId: newClientData.taxId || undefined,
            });

            if (result?.error) {
                toast.error(result.error);
            } else if (result?.data) {
                toast.success("Cliente creado exitosamente");
                setLocalClients((prev) => [result.data as Client, ...prev]);
                form.setValue("entityId", result.data.id);
                setIsDialogOpen(false);
                setNewClientData({ commercialName: "", taxId: "" });
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado al crear el cliente");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormField
            control={form.control}
            name="entityId"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                        <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue={field.value}
                            open={isSelectOpen}
                            onOpenChange={setIsSelectOpen}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {localClients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.commercialName}
                                    </SelectItem>
                                ))}

                                <div className="p-2 w-full border-t border-border mt-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-muted-foreground"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsSelectOpen(false);
                                            setTimeout(() => setIsDialogOpen(true), 150);
                                        }}
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        + Agregar nuevo cliente
                                    </Button>
                                </div>
                            </SelectContent>
                        </Select>
                    </FormControl>
                    <FormMessage />

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nuevo Cliente Rápido</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateClient} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="commercialName">Nombre Comercial / Razón Social <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="commercialName"
                                        value={newClientData.commercialName}
                                        onChange={(e) => setNewClientData({ ...newClientData, commercialName: e.target.value })}
                                        placeholder="Ej: Abarrotes San Juan"
                                        disabled={isSubmitting}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="taxId">RFC (Opcional)</Label>
                                    <Input
                                        id="taxId"
                                        value={newClientData.taxId}
                                        onChange={(e) => setNewClientData({ ...newClientData, taxId: e.target.value })}
                                        placeholder="Ej: ABC123456T1"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? "Guardando..." : "Guardar y Seleccionar"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </FormItem>
            )}
        />
    );
}
