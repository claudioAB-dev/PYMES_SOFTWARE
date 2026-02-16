"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { CreateOrderInput } from "@/lib/validators/orders";
import { Button } from "@/components/ui/button";
import {
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Product {
    id: string;
    name: string;
    price: string;
    stock: string;
}

interface OrderItemsTableProps {
    form: UseFormReturn<CreateOrderInput>;
    products: Product[];
}

export function OrderItemsTable({ form, products }: OrderItemsTableProps) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const getProductPrice = (productId: string) => {
        const product = products.find((p) => p.id === productId);
        return product ? parseFloat(product.price) : 0;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Partidas</h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ productId: "", quantity: 1, price: 0 })}
                >
                    Agregar Producto
                </Button>
            </div>

            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">Producto</TableHead>
                            <TableHead className="w-[15%]">Cantidad</TableHead>
                            <TableHead className="w-[20%]">Precio Unitario</TableHead>
                            <TableHead className="w-[20%] text-right">Total</TableHead>
                            <TableHead className="w-[5%]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.productId`}
                                        render={({ field: selectField }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={(value) => {
                                                            selectField.onChange(value);
                                                            const price = getProductPrice(value);
                                                            form.setValue(`items.${index}.price`, price);
                                                        }}
                                                        value={selectField.value}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccionar producto" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {products.map((product) => (
                                                                <SelectItem key={product.id} value={product.id}>
                                                                    {product.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.price`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    <TotalCell index={index} form={form} />
                                </TableCell>
                                <TableCell>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {fields.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                    No hay productos agregados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function TotalCell({ index, form }: { index: number; form: UseFormReturn<CreateOrderInput> }) {
    const quantity = form.watch(`items.${index}.quantity`);
    const price = form.watch(`items.${index}.price`);
    const total = (quantity || 0) * (price || 0);

    return <>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total)}</>;
}
