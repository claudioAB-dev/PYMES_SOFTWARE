// @ts-ignore
import Decimal from 'decimal.js';

export interface ItemInput {
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
    tasaIva?: number;
    tasaIsr?: number;
}

export interface ItemCalculated {
    importeBase: number;
    montoIva: number;
    montoRetencionIsr: number;
    totalLinea: number;
}

export interface InvoiceTotals {
    subtotal: number;
    descuento: number;
    totalImpuestosTrasladados: number;
    totalImpuestosRetenidos: number;
    total: number;
}

export function calculateCFDITotals(items: ItemInput[]): { items: ItemCalculated[], totals: InvoiceTotals } {
    let globalSubtotal = new Decimal(0);
    let globalDescuento = new Decimal(0);
    let globalIva = new Decimal(0);
    let globalRetencionIsr = new Decimal(0);

    const calculatedItems = items.map(item => {
        const cantidad = new Decimal(item.cantidad);
        const precioUnitario = new Decimal(item.precioUnitario);
        const descuento = new Decimal(item.descuento || 0);

        const importe = cantidad.times(precioUnitario).toDecimalPlaces(6, Decimal.ROUND_HALF_UP);
        const importeBase = importe.minus(descuento).toDecimalPlaces(6, Decimal.ROUND_HALF_UP);

        // SAT rules: Line item taxes calculated on base amount and truncated to 6 decimal places
        const tasaIva = new Decimal(item.tasaIva || 0);
        const montoIva = importeBase.times(tasaIva).toDecimalPlaces(6, Decimal.ROUND_DOWN);

        const tasaIsr = new Decimal(item.tasaIsr || 0);
        const montoRetencionIsr = importeBase.times(tasaIsr).toDecimalPlaces(6, Decimal.ROUND_DOWN);

        const totalLinea = importeBase.plus(montoIva).minus(montoRetencionIsr).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

        globalSubtotal = globalSubtotal.plus(importe);
        globalDescuento = globalDescuento.plus(descuento);
        globalIva = globalIva.plus(montoIva);
        globalRetencionIsr = globalRetencionIsr.plus(montoRetencionIsr);

        return {
            importeBase: importeBase.toNumber(),
            montoIva: montoIva.toNumber(),
            montoRetencionIsr: montoRetencionIsr.toNumber(),
            totalLinea: totalLinea.toNumber()
        };
    });

    // Invoice totals rounded to 2 decimal places
    const subtotal = globalSubtotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const totalDescuento = globalDescuento.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const totalImpuestosTrasladados = globalIva.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const totalImpuestosRetenidos = globalRetencionIsr.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    const total = subtotal
        .minus(totalDescuento)
        .plus(totalImpuestosTrasladados)
        .minus(totalImpuestosRetenidos)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return {
        items: calculatedItems,
        totals: {
            subtotal: subtotal.toNumber(),
            descuento: totalDescuento.toNumber(),
            totalImpuestosTrasladados: totalImpuestosTrasladados.toNumber(),
            totalImpuestosRetenidos: totalImpuestosRetenidos.toNumber(),
            total: total.toNumber()
        }
    };
}
