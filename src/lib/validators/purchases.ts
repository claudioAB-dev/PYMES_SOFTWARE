import { z } from "zod";
import { orderStatusEnum } from "@/db/schema";

export const purchaseOrderItemSchema = z.object({
    productId: z.string().uuid("Producto inválido"),
    quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1"),
    price: z.coerce.number().min(0, "El precio no puede ser negativo"),
});

export const createPurchaseOrderSchema = z.object({
    entityId: z.string().uuid("Proveedor requerido"),
    status: z.enum(orderStatusEnum.enumValues).default('DRAFT'),
    items: z.array(purchaseOrderItemSchema).min(1, "Debe agregar al menos un producto"),
    expectedDeliveryDate: z.coerce.date({
        required_error: "La fecha estimada de entrega es obligatoria",
        invalid_type_error: "Fecha inválida",
    }),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type PurchaseOrderItemInput = z.infer<typeof purchaseOrderItemSchema>;
