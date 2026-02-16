"use client";

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

interface Client {
    id: string;
    commercialName: string;
}

interface ClientSelectProps {
    form: UseFormReturn<CreateOrderInput>;
    clients: Client[];
}

export function ClientSelect({ form, clients }: ClientSelectProps) {
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
                            defaultValue={field.value}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.commercialName}
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
