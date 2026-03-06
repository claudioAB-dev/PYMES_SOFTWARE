import { z } from "zod";

export const insertPriceListSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional().or(z.literal("")),
    isActive: z.boolean().default(true).optional(),
});

export type InsertPriceListInput = z.infer<typeof insertPriceListSchema>;

export const insertPriceListItemSchema = z.object({
    priceListId: z.string().uuid("Invalid Price List ID"),
    productId: z.string().uuid("Invalid Product ID"),
    price: z.coerce.number().min(0, "Price must be greater than or equal to 0"),
});

export type InsertPriceListItemInput = z.infer<typeof insertPriceListItemSchema>;
