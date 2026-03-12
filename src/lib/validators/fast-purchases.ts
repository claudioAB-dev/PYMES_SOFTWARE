import { z } from "zod";

export const createFastPurchaseSchema = z.object({
    concept: z.string().min(2, "El concepto debe tener al menos 2 caracteres"),
    amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
    date: z.coerce.date({
        required_error: "La fecha es obligatoria",
        invalid_type_error: "Fecha inválida",
    }),
    entityId: z.string().uuid("Proveedor seleccionado inválido").optional().or(z.literal('none')),
    accountId: z.string().uuid("Seleccione una cuenta de origen válida"),
    requiresCfdi: z.boolean().default(true),
});

export type CreateFastPurchaseInput = z.infer<typeof createFastPurchaseSchema>;
