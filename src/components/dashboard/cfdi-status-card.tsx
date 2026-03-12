"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUploadZone } from "@/components/dashboard/file-upload-zone";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileCode2 } from "lucide-react";
import { getCfdiDownloadUrlAction } from "@/app/actions/cfdi-actions";
import { toast } from "sonner";
import { useState } from "react";

interface CfdiStatusCardProps {
    orderId: string;
    invoiceStatus: "pending" | "attached" | "not_required";
    transactionType: "sale" | "purchase";
}

export function CfdiStatusCard({ orderId, invoiceStatus, transactionType }: CfdiStatusCardProps) {
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [isDownloadingXml, setIsDownloadingXml] = useState(false);

    const handleDownload = async (type: "pdf" | "xml") => {
        if (type === "pdf") setIsDownloadingPdf(true);
        else setIsDownloadingXml(true);

        try {
            const result = await getCfdiDownloadUrlAction(orderId, type);
            if (result.success && result.url) {
                // Open URL in new window to download
                window.open(result.url, "_blank");
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Error al descargar el archivo.");
        } finally {
            if (type === "pdf") setIsDownloadingPdf(false);
            else setIsDownloadingXml(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Estado de Factura (CFDI)</CardTitle>
                <Badge
                    variant={invoiceStatus === "attached" ? "default" : invoiceStatus === "pending" ? "destructive" : "secondary"}
                >
                    {invoiceStatus === "attached" ? "Adjuntada" : invoiceStatus === "pending" ? "Pendiente" : "No Requerida"}
                </Badge>
            </CardHeader>
            <CardContent className="pt-4">
                {invoiceStatus === "pending" ? (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Sube los archivos correspondientes a esta {transactionType === "sale" ? "venta" : "compra"}.
                        </p>
                        <FileUploadZone orderId={orderId} transactionType={transactionType} />
                    </div>
                ) : invoiceStatus === "attached" ? (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Los documentos fiscales han sido adjuntados correctamente.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleDownload("pdf")}
                                disabled={isDownloadingPdf}
                            >
                                <FileText className="mr-2 h-4 w-4 text-destructive" />
                                Descargar PDF
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleDownload("xml")}
                                disabled={isDownloadingXml}
                            >
                                <FileCode2 className="mr-2 h-4 w-4 text-blue-600" />
                                Descargar XML
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Esta orden no requiere comprobante fiscal.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
