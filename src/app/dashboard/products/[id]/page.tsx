import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getProductMovements } from "../actions";
import { AdjustStockDialog } from "./adjust-stock-dialog";
import { Badge } from "@/components/ui/badge";
import { Package, Zap, ArrowLeft, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { memberships } from "@/db/schema";

export default async function ProductDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return notFound();

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) return notFound();
    const organizationId = userMemberships[0].organizationId;
    const role = userMemberships[0].role;

    const product = await db.query.products.findFirst({
        where: and(
            eq(products.id, params.id),
            eq(products.organizationId, organizationId)
        )
    });

    if (!product) return notFound();

    const movements = await getProductMovements(product.id);

    const formatCurrency = (value: string | number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value));
    }

    const typeLabels: Record<string, string> = {
        'IN_PURCHASE': 'Entrada (Compra)',
        'OUT_SALE': 'Salida (Venta)',
        'IN_RETURN': 'Entrada (Devolución/Cancelación)',
        'OUT_RETURN': 'Salida (Dev. Proveedor/Cancel. Compra)',
        'ADJUSTMENT': 'Ajuste Manual',
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/products">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{product.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            {product.sku && <Badge variant="secondary" className="font-mono">{product.sku}</Badge>}
                            {product.type === "PRODUCT" ? (
                                <Badge variant="outline" className="gap-1">
                                    <Package className="h-3 w-3" /> Producto
                                </Badge>
                            ) : (
                                <Badge variant="default" className="gap-1 bg-amber-500 hover:bg-amber-600">
                                    <Zap className="h-3 w-3" fill="currentColor" /> Servicio
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                {product.type === "PRODUCT" && (role === 'OWNER' || role === 'ADMIN') && (
                    <AdjustStockDialog productId={product.id} currentStock={product.stock} />
                )}
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card shadow-sm border rounded-lg p-6">
                        <p className="text-sm text-muted-foreground font-medium mb-1">Stock Actual</p>
                        <p className="text-4xl font-bold">
                            {product.type === "PRODUCT" ? product.stock : "N/A"}
                            <span className="text-lg font-normal text-muted-foreground ml-1">{product.uom}</span>
                        </p>
                    </div>
                    <div className="bg-card shadow-sm border rounded-lg p-6">
                        <p className="text-sm text-muted-foreground font-medium mb-1">Precio Unitario</p>
                        <p className="text-4xl font-bold">{formatCurrency(product.price)}</p>
                    </div>
                </div>

                {product.type === "PRODUCT" && (
                    <div className="bg-card shadow-sm border rounded-lg overflow-x-auto mt-8">
                        <div className="p-6 border-b flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold">Kardex (Historial de Movimientos)</h3>
                                <p className="text-sm text-muted-foreground">Registro inmutable de todas las entradas, salidas y ajustes de este producto.</p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <a href={`/api/reports/kardex/export?productId=${product.id}`} download>
                                    <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                                    Exportar a Excel
                                </a>
                            </Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Notas / Ref</TableHead>
                                    <TableHead className="text-right">Movimiento</TableHead>
                                    <TableHead className="text-right">Stock Anterior</TableHead>
                                    <TableHead className="text-right">Stock Resultante</TableHead>
                                    <TableHead>Usuario</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.length > 0 ? (
                                    movements.map((mov) => {
                                        const diff = Number(mov.newStock) - Number(mov.previousStock);
                                        const isPositive = diff > 0;
                                        const isNegative = diff < 0;

                                        return (
                                            <TableRow key={mov.id}>
                                                <TableCell className="whitespace-nowrap">
                                                    {format(new Date(mov.createdAt), 'dd/MM/yyyy HH:mm')}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {typeLabels[mov.type] || mov.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                                    {mov.notes || mov.referenceId || '-'}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    <span className={isPositive ? "text-emerald-600" : isNegative ? "text-red-600" : ""}>
                                                        {isPositive ? "+" : ""}{diff}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    {mov.previousStock}
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    {mov.newStock}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {mov.user?.fullName || mov.user?.email || 'Sistema'}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            No hay movimientos registrados para este producto.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
