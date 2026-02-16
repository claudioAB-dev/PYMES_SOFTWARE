
import { getProducts } from "./actions";
import { ProductTable, columns } from "./product-table";
import { CreateProductSheet } from "./create-product-sheet";

export default async function ProductsPage() {
    const products = await getProducts();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Productos y Servicios</h2>
                    <p className="text-muted-foreground">
                        Gestiona tu catálogo para generar órdenes de venta y compra.
                    </p>
                </div>
                <CreateProductSheet />
            </div>

            {/* @ts-ignore - Drizzle types vs Table types match loosely */}
            <ProductTable columns={columns} data={products} />
        </div>
    );
}
