import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface RecentSalesListProps {
    sales: any[]; // Using any for brevity with relation types, but should be typed properly
}

export function RecentSalesList({ sales }: RecentSalesListProps) {
    return (
        <Card className="col-span-4 lg:col-span-2">
            <CardHeader>
                <CardTitle>Ventas Recientes</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {sales.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No hay ventas recientes.</p>
                    ) : (
                        sales.map((sale) => (
                            <div key={sale.id} className="flex items-center">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback>
                                        {sale.entity?.commercialName?.slice(0, 2).toUpperCase() || "??"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{sale.entity?.commercialName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {sale.entity?.type === 'CLIENT' ? 'Cliente' : 'Cliente/Prov'}
                                    </p>
                                </div>
                                <div className="ml-auto flex flex-col items-end">
                                    <div className="text-sm font-medium">{formatCurrency(Number(sale.totalAmount))}</div>
                                    <Badge variant={sale.status === 'CONFIRMED' ? 'default' : 'secondary'} className="text-[10px] px-1 py-0 h-5 mt-1">
                                        {sale.status}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
