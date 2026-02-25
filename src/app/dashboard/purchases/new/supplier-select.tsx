"use client";

import { UseFormReturn } from "react-hook-form";
import { CreatePurchaseOrderInput } from "@/lib/validators/purchases";
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

interface Supplier {
    id: string;
    commercialName: string;
}

interface SupplierSelectProps {
    form: UseFormReturn<CreatePurchaseOrderInput>;
    suppliers: Supplier[];
}

export function SupplierSelect({ form, suppliers }: SupplierSelectProps) {
    return (
        <FormField
            control={form.control}
            name="entityId"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Proveedor</FormLabel>
                    <FormControl>
                        <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar proveedor" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers.map((supplier) => (
                                    <SelectItem key={supplier.id} value={supplier.id}>
                                        {supplier.commercialName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
