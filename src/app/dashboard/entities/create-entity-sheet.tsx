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
// import { useToast } from "@/hooks/use-toast"; // Assuming this exists or I'll need to create it/install it. 
// Shadcn usually installs a toast hook. If not, I'll skip toast for now or use alert.

export function CreateEntitySheet() {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    // const { toast } = useToast(); 

    const form = useForm<CreateEntityInput>({
        resolver: zodResolver(createEntitySchema),
        defaultValues: {
            name: "",
            rfc: "",
            type: "CLIENT",
            email: "",
            commercialName: "",
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
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Crear Entidad</SheetTitle>
                    <SheetDescription>
                        Agrega un nuevo cliente o proveedor a tu organización.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
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
                            <SheetFooter className="mt-6">
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? "Guardando..." : "Guardar"}
                                </Button>
                            </SheetFooter>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
