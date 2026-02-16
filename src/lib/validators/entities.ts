import { z } from "zod";

export const entityTypeEnum = z.enum(["CLIENT", "SUPPLIER", "BOTH"]);

export const createEntitySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    rfc: z.string().optional().or(z.literal("")).refine(val => !val || /^[a-zA-Z&Ñ]{3,4}\d{6}(?:[a-zA-Z\d]{3})?$/i.test(val), {
        message: "Invalid RFC format (e.g. XAXX010101000)"
    }),
    type: entityTypeEnum,
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    commercialName: z.string().min(2, "Commercial name must be at least 2 characters").optional().or(z.literal("")),
});

export type CreateEntityInput = z.infer<typeof createEntitySchema>;
