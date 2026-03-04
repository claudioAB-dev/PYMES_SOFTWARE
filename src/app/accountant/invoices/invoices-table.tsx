"use client";

import { useState } from "react";
import { Copy, Eye, FileText, Search, MoreHorizontal } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Tipo extraído del esquema fiscalDocuments
export type FiscalDocumentType = "I" | "E" | "T" | "N" | "P";

export interface FiscalDocument {
    id: string;
    uuid: string;
    issuerRfc: string;
    receiverRfc: string;
    issueDate: Date;
    type: FiscalDocumentType;
    subtotal: number;
    tax: number;
    total: number;
}

interface InvoicesTableProps {
    data: FiscalDocument[];
}

export function InvoicesTable({ data }: InvoicesTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");

    // Formatters
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("es-MX", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }).format(date);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
        }).format(amount);
    };

    const handleCopyUUID = (uuid: string) => {
        navigator.clipboard.writeText(uuid);
        // Idealmente un toast aquí.
    };

    const getTypeBadgeOptions = (type: FiscalDocumentType) => {
        switch (type) {
            case "I":
                return { label: "Ingreso", className: "bg-green-100/80 text-green-700 hover:bg-green-200 border-green-200" };
            case "E":
                return { label: "Egreso", className: "bg-red-100/80 text-red-700 hover:bg-red-200 border-red-200" };
            case "N":
                return { label: "Nómina", className: "bg-blue-100/80 text-blue-700 hover:bg-blue-200 border-blue-200" };
            case "P":
                return { label: "Pago", className: "bg-purple-100/80 text-purple-700 hover:bg-purple-200 border-purple-200" };
            case "T":
                return { label: "Traslado", className: "bg-gray-100/80 text-gray-700 hover:bg-gray-200 border-gray-200" };
            default:
                return { label: type, className: "bg-gray-100/80 text-gray-700 hover:bg-gray-200 border-gray-200" };
        }
    };

    // Filtrado
    const filteredData = data.filter((doc) => {
        const matchesSearch =
            doc.uuid.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.issuerRfc.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.receiverRfc.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = typeFilter === "ALL" || doc.type === typeFilter;

        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-4">
            {/* Controles de Tabla */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar UUID o RFC..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="w-full sm:max-w-[200px]">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Tipo de Comprobante" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos los tipos</SelectItem>
                            <SelectItem value="I">Ingreso</SelectItem>
                            <SelectItem value="E">Egreso</SelectItem>
                            <SelectItem value="N">Nómina</SelectItem>
                            <SelectItem value="P">Pago</SelectItem>
                            <SelectItem value="T">Traslado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Tabla */}
            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold text-gray-700">Fecha</TableHead>
                            <TableHead className="font-semibold text-gray-700">UUID</TableHead>
                            <TableHead className="font-semibold text-gray-700">RFC Emisor</TableHead>
                            <TableHead className="font-semibold text-gray-700">RFC Receptor</TableHead>
                            <TableHead className="font-semibold text-gray-700">Tipo</TableHead>
                            <TableHead className="text-right font-semibold text-gray-700">Subtotal</TableHead>
                            <TableHead className="text-right font-semibold text-gray-700">Impuestos</TableHead>
                            <TableHead className="text-right font-semibold text-gray-700">Total</TableHead>
                            <TableHead className="text-center font-semibold text-gray-700">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length > 0 ? (
                            filteredData.map((doc) => {
                                const badgeProps = getTypeBadgeOptions(doc.type);
                                return (
                                    <TableRow key={doc.id} className="hover:bg-muted/30">
                                        <TableCell className="text-gray-600 font-medium">
                                            {formatDate(doc.issueDate)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-600 font-mono">
                                                    {doc.uuid.substring(0, 8)}...
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-gray-400 hover:text-gray-600"
                                                    onClick={() => handleCopyUUID(doc.uuid)}
                                                    title="Copiar UUID completo"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-700">{doc.issuerRfc}</TableCell>
                                        <TableCell className="text-gray-700">{doc.receiverRfc}</TableCell>
                                        <TableCell>
                                            <Badge className={`${badgeProps.className} border-transparent font-medium`}>
                                                {badgeProps.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-gray-600">
                                            {formatCurrency(doc.subtotal)}
                                        </TableCell>
                                        <TableCell className="text-right text-gray-600">
                                            {formatCurrency(doc.tax)}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-gray-900">
                                            {formatCurrency(doc.total)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Abrir menú</span>
                                                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[160px]">
                                                    <DropdownMenuItem className="cursor-pointer">
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        <span>Ver XML</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        <span>Ver PDF</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-500">
                                        <FileText className="h-10 w-10 text-gray-300 mb-2" />
                                        <p className="text-sm">No se encontraron comprobantes fiscales</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
