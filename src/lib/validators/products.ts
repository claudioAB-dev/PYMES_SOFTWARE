import { z } from "zod";

export const productSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    sku: z.string().optional(),
    type: z.enum(["PRODUCT", "SERVICE"], {
        required_error: "Selecciona un tipo de producto",
    }),
    itemType: z.enum(["finished_good", "raw_material", "sub_assembly", "service"], {
        required_error: "Selecciona un tipo de ítem de manufactura",
    }),
    price: z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, "Ingresa un monto válido (ej. 100.50)"),
    priceIncludesVat: z.boolean().optional(),
    cost: z.coerce.number().min(0, "El costo no puede ser negativo"),
    stock: z.coerce
        .number()
        .int("El stock debe ser un número entero")
        .min(0, "El stock no puede ser negativo")
        .optional(),
    organizationId: z.string().uuid().optional(),
    satClaveProdServId: z.string().length(8, "Debe tener exactamente 8 caracteres").optional(),
    satClaveUnidadId: z.string().min(1).max(3, "Máximo 3 caracteres").optional(),
    esObjetoImpuesto: z.string().optional(),
    isManufacturable: z.boolean().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
