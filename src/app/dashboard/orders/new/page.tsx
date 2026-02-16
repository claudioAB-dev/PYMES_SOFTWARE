import { getCustomers, getProducts } from "../actions";
import { OrderForm } from "./order-form";

export const dynamic = 'force-dynamic';

export default async function NewOrderPage() {
    const [clients, products] = await Promise.all([
        getCustomers(),
        getProducts()
    ]);

    // Map clients if necessary, but getCustomers returns entities which have commercialName
    // products have name, price.

    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Nueva Orden de Venta</h1>
            </div>
            <OrderForm clients={clients} products={products} />
        </div>
    );
}
