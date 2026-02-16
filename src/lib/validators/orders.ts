import { z } from "zod";
import { orderStatusEnum } from "@/db/schema";

export const orderItemSchema = z.object({
    productId: z.string().uuid("Producto inválido"),
    quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1"),
    price: z.coerce.number().min(0, "El precio no puede ser negativo"),
});

export const createOrderSchema = z.object({
    entityId: z.string().uuid("Cliente requerido"),
    status: z.enum(orderStatusEnum.enumValues).default('DRAFT'),
    items: z.array(orderItemSchema).min(1, "Debe agregar al menos un producto"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
