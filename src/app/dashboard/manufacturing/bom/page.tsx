import { getProductsForBom } from "@/app/dashboard/manufacturing/bom/actions";
import { getRawMaterials } from "@/app/dashboard/manufacturing/raw-materials/actions";
import { BomWrapper } from "./bom-wrapper";

export const dynamic = 'force-dynamic';

export default async function BomPage() {
    const parentProducts = await getProductsForBom();
    const materials = await getRawMaterials();

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Gestor de Recetas / BOM</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Administra las Listas de Materiales (Bill of Materials) para tus productos y subensambles.
                </p>
            </div>

            <BomWrapper products={parentProducts} materials={materials} />
        </div>
    );
}
