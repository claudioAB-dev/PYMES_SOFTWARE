"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { updateBatchQualityStatus } from "@/app/actions/quality-control";

export default function QualityControlClient({ initialBatches }: { initialBatches: any[] }) {
    const [batches, setBatches] = useState(initialBatches);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<any>(null);
    const [actionType, setActionType] = useState<'AVAILABLE' | 'REJECTED'>('AVAILABLE');
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openDialog = (batch: any, action: 'AVAILABLE' | 'REJECTED') => {
        setSelectedBatch(batch);
        setActionType(action);
        setNotes("");
        setIsDialogOpen(true);
    };

    const handleConfirm = async () => {
        if (actionType === 'REJECTED' && !notes.trim()) {
            toast.error("Las notas son obligatorias para rechazar un lote.");
            return;
        }

        setIsSubmitting(true);
        const result = await updateBatchQualityStatus(selectedBatch.id, actionType, notes);
        setIsSubmitting(false);

        if (result.success) {
            toast.success(result.message);
            setBatches(batches.filter(b => b.id !== selectedBatch.id));
            setIsDialogOpen(false);
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className="rounded-md border bg-white text-slate-900 shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Lote</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Fecha Fab.</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {batches.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                No hay lotes en cuarentena.
                            </TableCell>
                        </TableRow>
                    ) : (
                        batches.map((batch) => (
                            <TableRow key={batch.id}>
                                <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                                <TableCell>{batch.product?.name || "Desconocido"}</TableCell>
                                <TableCell>{format(new Date(batch.manufacturingDate), "PP", { locale: es })}</TableCell>
                                <TableCell>{Number(batch.initialQuantity).toFixed(2)} {batch.product?.uom}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button 
                                        variant="outline" 
                                        className="border-green-600 text-green-600 hover:bg-green-50"
                                        size="sm"
                                        onClick={() => openDialog(batch, 'AVAILABLE')}
                                    >
                                        Aprobar
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="border-red-600 text-red-600 hover:bg-red-50"
                                        size="sm"
                                        onClick={() => openDialog(batch, 'REJECTED')}
                                    >
                                        Rechazar
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'AVAILABLE' ? 'Aprobar Lote' : 'Rechazar Lote'}
                        </DialogTitle>
                        <DialogDescription>
                            Lote: <span className="font-semibold">{selectedBatch?.batchNumber}</span> - {selectedBatch?.product?.name}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notas del Inspector {actionType === 'REJECTED' && <span className="text-red-500">*</span>}</Label>
                            <Textarea 
                                id="notes" 
                                placeholder="Escribe tus observaciones aquí..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button 
                            variant={actionType === 'AVAILABLE' ? 'default' : 'destructive'} 
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Procesando..." : (actionType === 'AVAILABLE' ? "Aprobar y Liberar" : "Rechazar Lote")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
