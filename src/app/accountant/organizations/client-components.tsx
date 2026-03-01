'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Building2, Mail, CheckCircle, Clock, Loader2 } from "lucide-react";
import { setActiveOrganization } from "../actions";
import { toast } from "sonner";
import { useState } from "react";
import { cancelClientInvite, resendClientInvite } from "../actions";
import { useRouter } from "next/navigation";

export function ClientCard({ organization }: { organization: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleManage = async () => {
        setIsLoading(true);
        try {
            await setActiveOrganization(organization.id);
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.message || "Error al seleccionar la empresa");
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {organization.name}
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-sm font-semibold truncate">
                    RFC: {organization.taxId || "Por definir"}
                </div>
                <div className="flex items-center mt-2 space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground font-medium">Empresa Activa</span>
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleManage}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Gestionar Cliente"}
                </Button>
            </CardFooter>
        </Card>
    );
}

export function PendingInviteCard({ invite }: { invite: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const [action, setAction] = useState<'resend' | 'cancel' | null>(null);

    const handleResend = async () => {
        setIsLoading(true);
        setAction('resend');
        try {
            const result = await resendClientInvite(invite.id);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            if (result.url) {
                await navigator.clipboard.writeText(result.url);
                toast.success("Enlace devuelto y copiado al portapapeles.");
            }
        } catch (e) {
            toast.error("Error al reenviar");
        } finally {
            setIsLoading(false);
            setAction(null);
        }
    };

    const handleCancel = async () => {
        if (!confirm("¿Estás seguro de cancelar esta invitación?")) return;
        setIsLoading(true);
        setAction('cancel');
        try {
            const result = await cancelClientInvite(invite.id);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success("Invitación cancelada");
        } catch (e) {
            toast.error("Error al cancelar");
        } finally {
            setIsLoading(false);
            setAction(null);
        }
    };

    return (
        <Card className="border-dashed border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {invite.organization?.name || "Empresa en creación"}
                </CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-sm truncate font-medium" title={invite.email}>
                    {invite.email}
                </div>
                <div className="flex items-center mt-2 space-x-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-xs text-muted-foreground font-medium">Esperando respuesta</span>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleResend}
                    disabled={isLoading}
                >
                    {isLoading && action === 'resend' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reenviar"}
                </Button>
                <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleCancel}
                    disabled={isLoading}
                >
                    {isLoading && action === 'cancel' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Cancelar"}
                </Button>
            </CardFooter>
        </Card>
    );
}
