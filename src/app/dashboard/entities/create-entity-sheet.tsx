"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEntitySchema, CreateEntityInput } from "@/lib/validators/entities";
import { createEntity } from "@/app/dashboard/entities/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";
import {
    Form,
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
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

export function CreateEntitySheet() {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const form = useForm<CreateEntityInput>({
        resolver: zodResolver(createEntitySchema) as any,
        defaultValues: {
            name: "",
            rfc: "",
            type: "CLIENT",
            email: "",
            commercialName: "",
            creditLimit: 0,
            creditDays: 0,
            razonSocialSat: "",
            regimenFiscal: "",
            codigoPostal: "",
            usoCfdiDefault: "",
        },
    });

    function onSubmit(data: CreateEntityInput) {
        console.log("Form submitted:", data);
        startTransition(async () => {
            console.log("Calling server action...");
            const result = await createEntity(data);
            console.log("Server action result:", result);

            if (result.error) {
                // toast({ title: "Error", description: result.error, variant: "destructive" });
                alert(result.error); // Fallback
            } else {
                // toast({ title: "Success", description: "Entity created successfully" });
                setOpen(false);
                form.reset();
            }
        });
    }

    function onError(errors: any) {
        console.error("Form validation errors:", errors);
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button>Nuevo Cliente/Proveedor</Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl flex flex-col h-full w-full">
                <SheetHeader>
                    <SheetTitle>Crear Entidad</SheetTitle>
                    <SheetDescription>
                        Agrega un nuevo cliente o proveedor a tu organización.
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-1 py-4 max-h-[calc(100vh-12rem)]">
                    <Form {...form}>
                        <form id="create-entity-form" onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre Comercial *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Empresa S.A. de C.V." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona el tipo" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="CLIENT">Cliente</SelectItem>
                                                    <SelectItem value="SUPPLIER">Proveedor</SelectItem>
                                                    <SelectItem value="BOTH">Ambos</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="contacto@empresa.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="creditLimit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Límite de Crédito ($)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="creditDays"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Días de Crédito</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="pt-2 space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium leading-none">Datos Fiscales (CFDI 4.0)</h3>
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        Requerido solo si vas a emitir facturas a esta entidad.
                                    </p>
                                </div>
                                <Separator />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name="razonSocialSat"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Razón Social (SAT)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="EMPRESA COMERCIAL DE MEXICO" {...field} />
                                                    </FormControl>
                                                    <p className="text-[0.8rem] text-muted-foreground leading-snug">
                                                        Nombre exacto en mayúsculas, sin régimen societario (ej. SA DE CV)
                                                    </p>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="rfc"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>RFC</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="XAXX010101000" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="codigoPostal"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Código Postal</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="12345" maxLength={5} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="regimenFiscal"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Régimen Fiscal</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecciona..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="601">601 - Morales General</SelectItem>
                                                        <SelectItem value="612">612 - Físicas Empresariales</SelectItem>
                                                        <SelectItem value="626">626 - RESICO</SelectItem>
                                                        <SelectItem value="616">616 - Sin obligaciones</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="usoCfdiDefault"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Uso de CFDI</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecciona..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="G03">G03 - Gastos en general</SelectItem>
                                                        <SelectItem value="P01">P01 - Por definir</SelectItem>
                                                        <SelectItem value="S01">S01 - Sin efectos fiscales</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>

                <div className="sticky bottom-0 border-t bg-background pt-4 pb-2 px-1 flex shrink-0 items-center justify-end gap-2">
                    <SheetClose asChild>
                        <Button type="button" variant="outline" disabled={isPending}>
                            Cancelar
                        </Button>
                    </SheetClose>
                    <Button type="submit" form="create-entity-form" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isPending ? "Guardando..." : "Guardar Entidad"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
