import { z } from "zod";

export const entityTypeEnum = z.enum(["CLIENT", "SUPPLIER", "BOTH"]);

export const createEntitySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    rfc: z.string().optional().refine(val => !val || /^[A-Z&Ñ]{3,4}\d{6}(?:[A-Z\d]{3})?$/.test(val), {
        message: "Invalid RFC format",
    }),
    type: entityTypeEnum,
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    commercialName: z.string().min(2, "Commercial name must be at least 2 characters").optional(), // Often same as legal name but good to have
});

export type CreateEntityInput = z.infer<typeof createEntitySchema>;
