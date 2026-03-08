"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { BomBuilder } from "@/components/manufacturing/BomBuilder";

interface Product {
    id: string;
    name: string;
    sku: string | null;
}

interface MaterialProduct extends Product {
    uom: string | null;
    cost: string;
    itemType?: "finished_good" | "raw_material" | "sub_assembly" | "service" | null;
}

interface BomWrapperProps {
    products: Product[];
    materials: MaterialProduct[];
}

export function BomWrapper({ products, materials }: BomWrapperProps) {
    const [open, setOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string>("");

    const selectedProduct = products.find((p) => p.id === selectedProductId);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2 max-w-xl">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Seleccionar Producto Final (Subensamble/Producto Terminado)
                </label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between h-10 border-slate-300 dark:border-slate-700"
                        >
                            <span className="truncate">
                                {selectedProduct ? `${selectedProduct.sku ? `[${selectedProduct.sku}] ` : ''}${selectedProduct.name}` : "Seleccione un producto para crear/editar su Receta..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Buscar por nombre o SKU..." />
                            <CommandList>
                                <CommandEmpty>No se encontraron productos.</CommandEmpty>
                                <CommandGroup>
                                    {products.map((product) => (
                                        <CommandItem
                                            key={product.id}
                                            value={`${product.sku || ''} ${product.name}`}
                                            onSelect={() => {
                                                setSelectedProductId(product.id === selectedProductId ? "" : product.id);
                                                setOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4 shrink-0",
                                                    selectedProductId === product.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900 dark:text-slate-100">{product.name}</span>
                                                {product.sku && <span className="text-xs text-slate-500 font-mono">SKU: {product.sku}</span>}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {selectedProductId ? (
                <div className="pt-2">
                    {/* Usamos key para forzar un re-montaje si el usuario cambia de producto, reiniciando el estado del formulario */}
                    <BomBuilder key={selectedProductId} parent_product_id={selectedProductId} materials={materials} />
                </div>
            ) : (
                <div className="rounded-md border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-slate-50 dark:bg-slate-900/50">
                    <div className="max-w-md mx-auto space-y-2">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Ningún producto seleccionado</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Busca y selecciona un producto del menú desplegable superior para comenzar a construir o editar su Lista de Materiales (BOM).
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
