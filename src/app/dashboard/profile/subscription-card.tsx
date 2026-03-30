"use client";

import { useState } from "react";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { createCustomerPortalSession } from "./actions";
import { toast } from "sonner";

interface SubscriptionCardProps {
    orgId: string;
    organizationName: string;
    plan: string;
}

export function SubscriptionCard({ orgId, organizationName, plan }: SubscriptionCardProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleManageSubscription = async () => {
        setIsLoading(true);
        try {
            const result = await createCustomerPortalSession(orgId);
            
            if (result.error) {
                toast.error(result.error);
                return;
            }

            if (result.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado al intentar acceder al portal de facturación.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const planName = plan === "manufactura" ? "Plan Manufactura" : 
                    plan === "pro" ? "Plan Pro" : 
                    plan === "free" ? "Plan Gratuito" : plan;

    return (
        <Card className="border-primary/20 bg-primary/5 transition-all hover:bg-primary/[0.07]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Suscripción / Facturación
                </CardTitle>
                <CardDescription>
                    Administra los métodos de pago y descarga tus facturas de {organizationName}.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Plan Actual
                    </span>
                    <span className="text-2xl font-bold text-foreground">
                        {planName}
                    </span>
                </div>
                
                <Button 
                    onClick={handleManageSubscription} 
                    disabled={isLoading}
                    className="w-full md:w-auto"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cargando Portal...
                        </>
                    ) : (
                        "Gestionar Suscripción / Facturación"
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
