import { z } from "zod";

export const createOrganizationSchema = z.object({
    name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
    slug: z.string().min(3, { message: "El slug debe tener al menos 3 caracteres." })
        .regex(/^[a-z0-9-]+$/, { message: "El slug solo puede contener letras minúsculas, números y guiones." }),
    rfc: z.string().optional().refine((val) => {
        if (!val) return true;
        // Basic RFC regex for Mexico: 
        // Persona Física: 4 letters, 6 numbers, 3 homoclave chars
        // Persona Moral: 3 letters, 6 numbers, 3 homoclave chars
        // Simplified regex to catch most cases
        const rfcRegex = /^([A-ZÑ&]{3,4}) ?(?:- ?)?(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])) ?(?:- ?)?([A-Z\d]{2})([A-Z\d])$/;
        return rfcRegex.test(val);
    }, { message: "El RFC no tiene un formato válido." }).or(z.literal("")),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
