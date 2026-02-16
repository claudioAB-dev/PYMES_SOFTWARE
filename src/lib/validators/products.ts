import { z } from "zod";

export const productSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    sku: z.string().optional(),
    type: z.enum(["PRODUCT", "SERVICE"], {
        required_error: "Selecciona un tipo de producto",
    }),
    price: z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, "Ingresa un monto válido (ej. 100.50)"),
    stock: z.coerce
        .number()
        .int("El stock debe ser un número entero")
        .min(0, "El stock no puede ser negativo")
        .optional(),
    organizationId: z.string().uuid().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
