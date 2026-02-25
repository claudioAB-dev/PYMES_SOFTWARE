import { getSuppliers } from "../actions";
import { getProducts } from "@/app/dashboard/orders/actions";
import { PurchaseOrderForm } from "./purchase-order-form";

export const dynamic = 'force-dynamic';

export default async function NewPurchaseOrderPage() {
    const [suppliers, products] = await Promise.all([
        getSuppliers(),
        getProducts() // We can reuse the getProducts action from orders since it gets all products
    ]);

    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Nueva Orden de Compra</h1>
            </div>
            <PurchaseOrderForm suppliers={suppliers} products={products} />
        </div>
    );
}
