'use client';

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from "@/components/ui/button";
import { Loader2, FileDown } from "lucide-react";
import { OrderPdf } from './OrderPdf';

interface DownloadPdfButtonProps {
    order: any;
}

export function DownloadPdfButton({ order }: DownloadPdfButtonProps) {
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <Button variant="outline" size="sm" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando PDF...
            </Button>
        );
    }

    return (
        <PDFDownloadLink
            document={<OrderPdf order={order} />}
            fileName={`orden-${order.id.slice(0, 8)}.pdf`}
        >
            {({ blob, url, loading, error }) =>
                loading ? (
                    <Button variant="outline" size="sm" disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando...
                    </Button>
                ) : (
                    <Button variant="outline" size="sm">
                        <FileDown className="mr-2 h-4 w-4" />
                        Descargar PDF
                    </Button>
                )
            }
        </PDFDownloadLink>
    );
}
