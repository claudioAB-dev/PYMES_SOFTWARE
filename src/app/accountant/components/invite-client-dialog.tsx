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
import { LinkIcon, Copy, Loader2, Check } from "lucide-react";
import { generateClientInviteLink } from "../actions";
import { toast } from "sonner";

export function InviteClientDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerateLink = async () => {
        setIsLoading(true);
        try {
            const result = await generateClientInviteLink();
            if (result.error) {
                toast.error(result.error);
                return;
            }
            if (result.url) {
                setInviteUrl(result.url);
            }
        } catch (error) {
            toast.error("Error al generar el enlace de invitación");
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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setInviteUrl(null); // Reset on close
        }}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                    <LinkIcon className="h-4 w-4" />
                    Invitar Nuevo Cliente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invitar Nuevo Cliente</DialogTitle>
                    <DialogDescription>
                        Genera un enlace especial para que tu cliente cree su empresa en Axioma y se vincule automáticamente a tu portal contable.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col space-y-4 py-4">
                    {!inviteUrl ? (
                        <Button
                            onClick={handleGenerateLink}
                            disabled={isLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 w-full"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generando enlace...
                                </>
                            ) : (
                                "Generar Enlace de Invitación"
                            )}
                        </Button>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <label htmlFor="link" className="sr-only">
                                    Enlace
                                </label>
                                <Input
                                    id="link"
                                    defaultValue={inviteUrl}
                                    readOnly
                                    className="font-mono text-sm"
                                />
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                className="px-3"
                                onClick={handleCopy}
                            >
                                <span className="sr-only">Copiar</span>
                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
