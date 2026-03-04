import { z } from "zod";

export const createDirectExpenseSchema = z.object({
    accountId: z.string().uuid({ message: "Cuenta inválida" }),
    amount: z.coerce.number().positive({ message: "El monto debe ser mayor a 0" }),
    category: z.enum(['OPERATING_EXPENSE', 'TAX'], {
        required_error: "Seleccione una categoría válida",
    }),
    description: z.string().min(1, { message: "La descripción es requerida" }),
    date: z.coerce.date().optional(),
});

export type CreateDirectExpenseInput = z.infer<typeof createDirectExpenseSchema>;
