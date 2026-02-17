import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface KPICardProps {
    title: string;
    value: number;
    icon: LucideIcon;
    description?: string;
    isCurrency?: boolean;
}

export function KPICard({ title, value, icon: Icon, description, isCurrency = true }: KPICardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {isCurrency ? formatCurrency(value) : value}
                </div>
                {description && (
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
