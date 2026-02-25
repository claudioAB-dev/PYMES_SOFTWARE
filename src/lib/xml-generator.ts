export interface XmlOrderData {
    id: string;
    date: string;
    totalAmount: number;
    subtotal: number;
    tax: number;
    paymentMethod: string;
    entity: {
        commercialName: string;
        legalName: string | null;
        taxId: string | null;
        postalCode: string | null;
    };
    items: {
        id: string;
        quantity: number;
        unitPrice: number;
        product: {
            name: string;
            uom: string | null;
        };
    }[];
}

function escapeXml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\\'': return ' & apos; ';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

export function generateCfdi40Xml(order: XmlOrderData): string {
    const defaultUom = 'H87'; // Pieza, SAT default if unknown

    // Mapeo básico de forma de pago
    let formaPago = '99'; // Por definir
    switch (order.paymentMethod) {
        case 'CASH': formaPago = '01'; break; // Efectivo
        case 'TRANSFER': formaPago = '03'; break; // Transferencia
        case 'CARD': formaPago = '04'; break; // Tarjeta de Crédito (o 28 Débito)
    }

    const folio = escapeXml(order.id.slice(0, 8).toUpperCase());
    const fecha = new Date(order.date).toISOString().slice(0, 19);
    const subTotal = order.subtotal.toFixed(2);
    const total = order.totalAmount.toFixed(2);
    const taxTotal = order.tax.toFixed(2);

    const rfcEmisor = 'XAXX010101000';
    const nombreEmisor = 'AXIOMA ERP S.A. DE C.V.';
    const rfcReceptor = escapeXml(order.entity.taxId || 'XAXX010101000');
    const nombreReceptor = escapeXml(order.entity.legalName || order.entity.commercialName);
    const cpReceptor = escapeXml(order.entity.postalCode || '00000');

    let conceptosXml = '';
    for (const item of order.items) {
        const importe = item.quantity * item.unitPrice;
        const impuesto = importe * 0.16;

        conceptosXml += `
        <cfdi:Concepto ClaveProdServ="01010101" NoIdentificacion="${escapeXml(item.id.slice(0, 8))}" Cantidad="${item.quantity.toFixed(2)}" ClaveUnidad="${escapeXml(item.product.uom || defaultUom)}" Unidad="${escapeXml(item.product.uom || 'Pieza')}" Descripcion="${escapeXml(item.product.name)}" ValorUnitario="${item.unitPrice.toFixed(2)}" Importe="${importe.toFixed(2)}" ObjetoImp="02">
            <cfdi:Impuestos>
                <cfdi:Traslados>
                    <cfdi:Traslado Base="${importe.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${impuesto.toFixed(2)}"/>
                </cfdi:Traslados>
            </cfdi:Impuestos>
        </cfdi:Concepto>`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd" Version="4.0" Serie="A" Folio="${folio}" Fecha="${fecha}" Sello="" NoCertificado="" Certificado="" SubTotal="${subTotal}" Moneda="MXN" Total="${total}" TipoDeComprobante="I" Exportacion="01" MetodoPago="PUE" LugarExpedicion="00000" FormaPago="${formaPago}">
    <cfdi:Emisor Rfc="${rfcEmisor}" Nombre="${nombreEmisor}" RegimenFiscal="601"/>
    <cfdi:Receptor Rfc="${rfcReceptor}" Nombre="${nombreReceptor}" DomicilioFiscalReceptor="${cpReceptor}" RegimenFiscalReceptor="616" UsoCFDI="G03"/>
    <cfdi:Conceptos>${conceptosXml}
    </cfdi:Conceptos>
    <cfdi:Impuestos TotalImpuestosTrasladados="${taxTotal}">
        <cfdi:Traslados>
            <cfdi:Traslado Base="${subTotal}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${taxTotal}"/>
        </cfdi:Traslados>
    </cfdi:Impuestos>
</cfdi:Comprobante>`;

    return xml;
}
