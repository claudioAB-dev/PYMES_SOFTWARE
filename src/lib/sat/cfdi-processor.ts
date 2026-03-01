import { XMLParser } from "fast-xml-parser";
import { SupabaseClient } from "@supabase/supabase-js";

export async function processAndStoreCFDI(
    xmlString: string,
    organizationId: string,
    supabase: SupabaseClient
) {
    try {
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "",
            parseAttributeValue: false, // Mantenemos los atributos como strings para evitar pérdidas de precisión en montos numéricos
        });

        const parsed = parser.parse(xmlString);

        // 1. Acceder al nodo raíz del comprobante
        const comprobante = parsed?.['cfdi:Comprobante'];
        if (!comprobante) {
            throw new Error("XML inválido: No se encontró el nodo raíz 'cfdi:Comprobante'.");
        }

        // 2. Extraer Emisor y Receptor
        const emisor = comprobante['cfdi:Emisor'];
        const receptor = comprobante['cfdi:Receptor'];

        if (!emisor || !receptor) {
            throw new Error("XML inválido: Falta la información del emisor o receptor ('cfdi:Emisor' o 'cfdi:Receptor').");
        }

        const issuerRfc = emisor.Rfc;
        const receiverRfc = receptor.Rfc;

        // 3. Fechas y Tipo
        const issueDateStr = comprobante.Fecha;
        if (!issueDateStr) {
            throw new Error("XML inválido: Falta el atributo 'Fecha' en el comprobante.");
        }
        const issueDate = new Date(issueDateStr);

        const type = comprobante.TipoDeComprobante;

        // 4. Totales
        // Como fast-xml-parser puede llegar a parsear los números si no se desactiva por completo o si la estructura lo dicta,
        // nos aseguramos de tratar subtotal y total como strings.
        const subtotal = typeof comprobante.SubTotal === 'number' ? comprobante.SubTotal.toString() : (comprobante.SubTotal || "0");
        const total = typeof comprobante.Total === 'number' ? comprobante.Total.toString() : (comprobante.Total || "0");

        // 5. Impuestos (usualmente un solo elemento `cfdi:Impuestos` a nivel comprobante)
        const impuestos = comprobante['cfdi:Impuestos'];
        let tax = "0";
        if (impuestos) {
            // En caso de que se parseado como array u objeto directamente
            const impuestosObj = Array.isArray(impuestos) ? impuestos[0] : impuestos;
            if (impuestosObj.TotalImpuestosTrasladados) {
                tax = typeof impuestosObj.TotalImpuestosTrasladados === 'number'
                    ? impuestosObj.TotalImpuestosTrasladados.toString()
                    : impuestosObj.TotalImpuestosTrasladados;
            }
        }

        // 6. Buscar el TimbreFiscalDigital dentro de Complemento
        let complementoObj = comprobante['cfdi:Complemento'];
        if (!complementoObj) {
            throw new Error("XML inválido: No se encontró el nodo 'cfdi:Complemento'.");
        }

        // Convertir en arreglo por si hay múltiples complementos (como Pagos + Timbre)
        const complementoArray = Array.isArray(complementoObj) ? complementoObj : [complementoObj];

        let timbre: any = null;
        for (const comp of complementoArray) {
            if (comp['tfd:TimbreFiscalDigital']) {
                timbre = comp['tfd:TimbreFiscalDigital'];
                break;
            }
        }

        if (!timbre) {
            throw new Error("XML inválido: No se encontró el nodo 'tfd:TimbreFiscalDigital' (el XML no parece estar timbrado).");
        }

        const timbreObj = Array.isArray(timbre) ? timbre[0] : timbre;
        const uuid = timbreObj.UUID;

        if (!uuid) {
            throw new Error("XML inválido: No se pudo extraer el UUID del timbre fiscal.");
        }

        // 7. Subir el XML a Supabase Storage
        const year = issueDate.getFullYear();
        const month = String(issueDate.getMonth() + 1).padStart(2, '0');
        // Generar ruta: {organizationId}/{año}/{mes}/{uuid}.xml
        const storagePathXml = `${organizationId}/${year}/${month}/${uuid}.xml`;

        const { error: uploadError } = await supabase.storage
            .from('fiscal-vault')
            .upload(storagePathXml, xmlString, {
                contentType: 'application/xml',
                upsert: true
            });

        if (uploadError) {
            throw new Error(`Error al subir el XML a Supabase Storage: ${uploadError.message}`);
        }

        // 8. Retornar los datos parseados listos para esquema de base de datos (`fiscal_documents`)
        return {
            organizationId,
            uuid,
            issuerRfc,
            receiverRfc,
            issueDate,
            type: type as "I" | "E" | "T" | "N" | "P",
            subtotal,
            tax,
            total,
            storagePathXml,
        };

    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error procesando CFDI: ${error.message}`);
        }
        throw new Error('Error desconocido al procesar CFDI');
    }
}
