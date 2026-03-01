'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Copy, Loader2, Check } from "lucide-react";
import { inviteClient } from "../actions";
import { toast } from "sonner";

export function InviteClientDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Form state
    const [companyName, setCompanyName] = useState("");
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!companyName.trim() || !email.trim()) {
            toast.error("Por favor completa todos los campos");
            return;
        }

        setIsLoading(true);
        try {
            const result = await inviteClient({ companyName, email });
            if (result.error) {
                toast.error(result.error);
                return;
            }
            if (result.url) {
                setInviteUrl(result.url);
                toast.success("Empresa creada e invitación generada");
            }
        } catch (error) {
            toast.error("Error al generar la invitación");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!inviteUrl) return;
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            toast.success("Enlace copiado al portapapeles");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("Error al copiar al portapapeles");
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            // Reset state on close
            setTimeout(() => {
                setInviteUrl(null);
                setCompanyName("");
                setEmail("");
            }, 300); // Wait for transition
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                    <PlusCircle className="h-4 w-4" />
                    Vincular Nueva Empresa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Vincular Nueva Empresa</DialogTitle>
                    <DialogDescription>
                        Registra una nueva empresa y genera un enlace para que tu cliente cree su cuenta como propietario.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col space-y-4 py-4">
                    {!inviteUrl ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                                <Input
                                    id="companyName"
                                    placeholder="Ej. Distribuidora León S.A. de C.V."
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo del Cliente</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="cliente@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-indigo-600 hover:bg-indigo-700 w-full mt-4"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creando empresa...
                                    </>
                                ) : (
                                    "Crear Empresa e Invitar"
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="flex flex-col space-y-4">
                            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-200">
                                La empresa <strong>{companyName}</strong> se ha registrado exitosamente.
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="grid flex-1 gap-2">
                                    <Label htmlFor="link" className="sr-only">
                                        Enlace
                                    </Label>
                                    <Input
                                        id="link"
                                        defaultValue={inviteUrl}
                                        readOnly
                                        className="font-mono text-sm"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    size="icon"
                                    className="px-3 flex-shrink-0"
                                    onClick={handleCopy}
                                    title="Copiar enlace"
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => handleOpenChange(false)}
                            >
                                Cerrar
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
