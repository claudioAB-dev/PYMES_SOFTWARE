"use client";

import { useState, useRef } from "react";
import { FileCode, Loader2, UploadCloud, X, File as FileIcon } from "lucide-react";
import { toast } from "sonner";
import { processSatXmls, ConciliationResult } from "./actions";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ManualUploadFormProps {
    organizationId: string;
}

export function ManualUploadForm({ organizationId }: ManualUploadFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
        const files = Array.from(e.dataTransfer.files).filter(file => file.name.endsWith('.xml'));
        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files]);
        } else {
            toast.error("Solo se permiten archivos XML.");
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...files]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    async function handleProcessFiles() {
        if (selectedFiles.length === 0) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("organizationId", organizationId);
            selectedFiles.forEach(file => formData.append("files", file));

            const result = await processSatXmls(formData);

            if (result.success && result.data) {
                toast.success("XMLs procesados y conciliados exitosamente.");
                window.dispatchEvent(new CustomEvent<ConciliationResult[]>('onXmlsProcessed', {
                    detail: result.data as ConciliationResult[]
                }));
                setSelectedFiles([]);
            } else {
                toast.error(result.error || "Ocurrió un error al procesar.");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado al subir los archivos.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="flex flex-col sticky top-6 border-border/50 shadow-sm">
            <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                    <FileCode className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">Conciliación Manual</CardTitle>
                </div>
                <CardDescription>
                    Sube múltiples archivos XML (CFDI) para compararlos contra las operaciones registradas en Axioma.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <div
                    className={`border-2 border-dashed rounded-lg p-10 text-center transition-all duration-200 cursor-pointer ${isDragging ? 'border-primary bg-primary/10 scale-[1.02] shadow-sm' : 'border-muted-foreground/30 bg-muted/30 hover:bg-muted/50 hover:border-primary/50'
                        } ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <UploadCloud className={`mx-auto h-12 w-12 mb-4 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                    <h3 className={`text-base font-semibold mb-1 transition-colors ${isDragging ? 'text-primary' : ''}`}>
                        Arrastra tus XMLs aquí o haz clic para explorar
                    </h3>
                    <p className="text-sm text-muted-foreground">Puedes seleccionar múltiples archivos a la vez.</p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".xml"
                        multiple
                        className="hidden"
                    />
                </div>

                {selectedFiles.length > 0 && (
                    <div className="space-y-2 mt-4 max-h-40 overflow-y-auto pr-2">
                        {selectedFiles.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileIcon className="h-4 w-4 text-primary shrink-0" />
                                    <span className="truncate">{file.name}</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(index);
                                    }}
                                    disabled={isSubmitting}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
            {selectedFiles.length > 0 && (
                <CardFooter>
                    <Button
                        type="button"
                        onClick={handleProcessFiles}
                        className="w-full text-white bg-primary hover:bg-primary/90"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                Procesar y Conciliar {selectedFiles.length} {selectedFiles.length === 1 ? 'archivo' : 'archivos'}
                            </>
                        )}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
