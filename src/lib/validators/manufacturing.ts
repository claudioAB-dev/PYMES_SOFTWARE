import * as z from "zod";

export const bomLineSchema = z.object({
    component_product_id: z
        .string({ required_error: "El ID del componente es requerido." })
        .uuid({ message: "El ID del componente debe ser un formato UUID válido." }),

    quantity: z
        .union([z.string(), z.number()], { required_error: "La cantidad es requerida." })
        .refine(
            (val) => {
                const num = typeof val === "string" ? parseFloat(val) : val;
                return !isNaN(num) && num > 0;
            },
            { message: "La cantidad debe ser un valor numérico estrictamente mayor a 0." }
        ),

    scrap_factor: z
        .union([z.string(), z.number()], { required_error: "El factor de merma es requerido." })
        .refine(
            (val) => {
                const num = typeof val === "string" ? parseFloat(val) : val;
                return !isNaN(num) && num >= 0 && num <= 100;
            },
            { message: "El factor de merma debe ser entre 0 y 100." }
        ),

    uom: z.string({ required_error: "La unidad de medida es requerida." }),

    unit_cost: z.number({ required_error: "El costo unitario es requerido." }),
});

export const bomFormSchema = z
    .object({
        parent_product_id: z
            .string({ required_error: "El ID del producto principal es requerido." })
            .uuid({ message: "El ID del producto principal debe ser un formato UUID válido." }),

        components: z
            .array(bomLineSchema)
            .min(1, { message: "La lista de materiales debe contener al menos un componente." }),
    })
    .superRefine((data, ctx) => {
        data.components.forEach((component, index) => {
            if (component.component_product_id === data.parent_product_id) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Dependencia circular inválida: El producto principal no puede incluirse a sí mismo como componente de su propia receta.",
                    path: ["components", index, "component_product_id"],
                });
            }
        });
    });

export type BomLineValues = z.infer<typeof bomLineSchema>;
export type BomFormValues = z.infer<typeof bomFormSchema>;
