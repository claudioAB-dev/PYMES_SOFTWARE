"use client";

import { useState, useRef } from "react";
import { CloudUpload, File as FileIcon, Loader2, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { uploadCfdiAction } from "@/app/actions/cfdi-actions";
import { Button } from "@/components/ui/button";

interface FileUploadZoneProps {
    orderId: string;
    transactionType: "sale" | "purchase";
    onSuccess?: () => void;
}

export function FileUploadZone({ orderId, transactionType, onSuccess }: FileUploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [xmlFile, setXmlFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            processFiles(files);
        }
    };

    const processFiles = (files: File[]) => {
        files.forEach((file) => {
            if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
                setPdfFile(file);
            } else if (file.type === "text/xml" || file.name.endsWith(".xml")) {
                setXmlFile(file);
            } else {
                toast.error(`Archivo no soportado: ${file.name}`);
            }
        });
    };

    const handleUpload = async () => {
        if (!pdfFile && !xmlFile) {
            toast.error("Selecciona al menos un archivo PDF o XML.");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("orderId", orderId);
        formData.append("transactionType", transactionType);

        if (pdfFile) formData.append("pdf", pdfFile);
        if (xmlFile) formData.append("xml", xmlFile);

        try {
            const result = await uploadCfdiAction(formData);

            if (result.success) {
                toast.success(result.message);
                setPdfFile(null);
                setXmlFile(null);
                onSuccess?.();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Error al procesar la subida.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full">
            <div
                className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:bg-muted/50"
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                    <CloudUpload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm">
                        <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs">
                        Archivos PDF y XML permitidos
                    </p>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.xml,application/pdf,text/xml"
                    onChange={handleFileChange}
                />
            </div>

            {/* Selected Files List */}
            {(pdfFile || xmlFile) && (
                <div className="mt-4 space-y-3">
                    {pdfFile && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md border text-sm">
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <FileIcon className="h-5 w-5 text-destructive shrink-0" />
                                <span className="truncate max-w-[200px]">{pdfFile.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setPdfFile(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    {xmlFile && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md border text-sm">
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <FileIcon className="h-5 w-5 text-blue-500 shrink-0" />
                                <span className="truncate max-w-[200px]">{xmlFile.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setXmlFile(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    <Button
                        onClick={handleUpload}
                        disabled={isUploading || (!pdfFile && !xmlFile)}
                        className="w-full mt-4"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Subiendo...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Adjuntar Documentos
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
