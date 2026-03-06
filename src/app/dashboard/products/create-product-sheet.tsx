"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductInput } from "@/lib/validators/products";
import { createProduct } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

function AsyncCombobox({
    value,
    onChange,
    endpoint,
    placeholder,
    emptyText,
    searchPlaceholder,
    idKey = "id",
    labelKey = "descripcion",
}: {
    value?: string;
    onChange: (val: string) => void;
    endpoint: string;
    placeholder: string;
    emptyText: string;
    searchPlaceholder: string;
    idKey?: string;
    labelKey?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;

        const fetchResults = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (error) {
                console.error("Error fetching", error);
            } finally {
                setLoading(false);
            }
        };

        const timeout = setTimeout(fetchResults, 300);
        return () => clearTimeout(timeout);
    }, [query, endpoint, open]);

    const selectedItem = results.find((r) => r[idKey] === value) || { [idKey]: value, [labelKey]: value };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <FormControl>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn("w-full justify-between font-normal", !value && "text-muted-foreground")}
                    >
                        {value ? `${selectedItem[idKey] || ""} ${selectedItem[labelKey] && selectedItem[labelKey] !== value ? `- ${selectedItem[labelKey]}` : ""}` : placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        <CommandEmpty>{loading ? "Buscando..." : emptyText}</CommandEmpty>
                        <CommandGroup>
                            {results.map((item) => (
                                <CommandItem
                                    key={item[idKey]}
                                    value={item[idKey]}
                                    onSelect={(currentValue) => {
                                        onChange(item[idKey]);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === item[idKey] ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {item[idKey]} - {item[labelKey]}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export function CreateProductSheet() {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<ProductInput>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            sku: "",
            price: "",
            cost: 0,
            priceIncludesVat: false,
            stock: 0,
            type: "PRODUCT",
            esObjetoImpuesto: "02",
        },
    });

    const productType = form.watch("type");

    function onSubmit(data: ProductInput) {
        startTransition(async () => {
            const result = await createProduct(data);

            if (result.error) {
                toast.error(result.error);
            } else {
                setOpen(false);
                form.reset();
                toast.success("Producto creado exitosamente");
            }
        });
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button>Nuevo Producto</Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl flex flex-col h-full w-full">
                <SheetHeader>
                    <SheetTitle>Crear Producto</SheetTitle>
                    <SheetDescription>
                        Agrega un nuevo producto o servicio a tu inventario.
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-1 py-4 max-h-[calc(100vh-12rem)]">
                    <Form {...form}>
                        <form id="create-product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel>Tipo</FormLabel>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                        className="flex flex-col space-y-1"
                                                    >
                                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value="PRODUCT" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">
                                                                Producto
                                                            </FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                                            <FormControl>
                                                                <RadioGroupItem value="SERVICE" />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">
                                                                Servicio
                                                            </FormLabel>
                                                        </FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej. Laptop HP" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="sku"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SKU</FormLabel>
                                            <FormControl>
                                                <Input placeholder="OPCIONAL-001" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {productType === "PRODUCT" && (
                                    <FormField
                                        control={form.control}
                                        name="stock"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Stock Inicial</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        {...field}
                                                        value={field.value ?? ""}
                                                        onChange={(e) => {
                                                            const val = e.target.value === "" ? undefined : Number(e.target.value);
                                                            field.onChange(val);
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Precio Venta *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="cost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Costo *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value === "" ? undefined : Number(e.target.value);
                                                        field.onChange(val);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="md:col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="priceIncludesVat"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>
                                                        ¿El precio incluye IVA (16%)?
                                                    </FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={!!field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-medium leading-none">Datos Fiscales (CFDI 4.0)</h3>
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        Requerido para la facturación electrónica.
                                    </p>
                                </div>
                                <Separator />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name="esObjetoImpuesto"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Objeto de Impuesto (SAT)</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecciona si es objeto de impuesto" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="01">01 - No objeto de impuesto</SelectItem>
                                                            <SelectItem value="02">02 - Sí objeto de impuesto</SelectItem>
                                                            <SelectItem value="03">03 - Sí objeto del impuesto y no obligado al desglose</SelectItem>
                                                            <SelectItem value="04">04 - Sí objeto del impuesto y no causa impuesto</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="satClaveProdServId"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Clave Prod/Serv (SAT)</FormLabel>
                                                <AsyncCombobox
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    endpoint="/api/sat/catalogs/prod-serv"
                                                    placeholder="Selecciona una clave..."
                                                    emptyText="No se encontraron claves."
                                                    searchPlaceholder="Buscar por clave o descripción..."
                                                    idKey="id"
                                                    labelKey="descripcion"
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="satClaveUnidadId"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Clave Unidad (SAT)</FormLabel>
                                                <AsyncCombobox
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    endpoint="/api/sat/catalogs/unidades"
                                                    placeholder="Selecciona una unidad..."
                                                    emptyText="No se encontraron unidades."
                                                    searchPlaceholder="Buscar por clave o nombre..."
                                                    idKey="id"
                                                    labelKey="nombre"
                                                />
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
                    <Button type="submit" form="create-product-form" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isPending ? "Guardando..." : "Guardar Producto"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
