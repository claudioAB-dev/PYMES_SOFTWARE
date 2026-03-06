"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/db";
import { fiscalDocuments, satRequests, orders, treasuryTransactions, organizations, financialAccounts } from "@/db/schema";
import { eq, desc, and, inArray, isNull, sql } from "drizzle-orm";
import { processAndStoreCFDI } from "@/lib/sat/cfdi-processor";
import { createClient } from "@/lib/supabase/server";
import { XMLParser } from "fast-xml-parser";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Initialize Supabase admin client for server-side trusted operations
const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function uploadManualXML(formData: FormData, _clientOrgId: string) {
    try {
        const cookieStore = await cookies();
        const organizationId = cookieStore.get('axioma_active_org')?.value;
        if (!organizationId) {
            throw new Error("No hay ninguna organización seleccionada en la sesión.");
        }

        const file = formData.get("file") as File | null;
        if (!file) {
            throw new Error("No se proporcionó ningún archivo XML.");
        }

        const xmlString = await file.text();

        // Call our core service
        const result = await processAndStoreCFDI(xmlString, organizationId, supabaseAdmin);

        // Store metadata in the database
        await db.insert(fiscalDocuments).values(result);

        revalidatePath("/accountant/sat-sync");

        return { success: true, message: "XML procesado y guardado correctamente." };
    } catch (error) {
        console.error("Error in uploadManualXML:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Error desconocido al procesar el XML." };
    }
}

import { inngest } from "@/lib/inngest/client";

export async function requestMassiveSync(month: number, year: number) {
    try {
        const cookieStore = await cookies();
        const organizationId = cookieStore.get('axioma_active_org')?.value;
        if (!organizationId) {
            throw new Error("No hay ninguna organización seleccionada en la sesión.");
        }

        // Generate start and end dates for the selected month
        // month is 1-indexed (1=January), so month - 1 for Date constructor
        const periodStart = new Date(year, month - 1, 1);
        const periodEnd = new Date(year, month, 0); // Last day of the month

        // Insert the pending request
        const [insertedRequest] = await db.insert(satRequests).values({
            organizationId,
            status: "PENDING",
            periodStart,
            periodEnd,
        }).returning();

        // Disparar job de Inngest indicando la solicitud
        await inngest.send({
            name: "sat.sync.requested",
            data: {
                satRequestId: insertedRequest.id,
                orgId: organizationId,
            }
        });

        revalidatePath("/accountant/sat-sync");

        return { success: true, message: "Solicitud de descarga masiva puesta en cola con éxito." };
    } catch (error) {
        console.error("Error in requestMassiveSync:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Error desconocido al solicitar la sincronización masiva." };
    }
}

export async function requestMockMassiveSync() {
    try {
        const cookieStore = await cookies();
        const organizationId = cookieStore.get('axioma_active_org')?.value;
        if (!organizationId) {
            throw new Error("No hay ninguna organización seleccionada en la sesión.");
        }

        // We use the current month for mock
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Insert the pending request
        const [insertedRequest] = await db.insert(satRequests).values({
            organizationId,
            status: "PENDING",
            periodStart,
            periodEnd,
        }).returning();

        // Disparar job de Inngest indicando la solicitud MOCK
        await inngest.send({
            name: "sat.sync.requested",
            data: {
                satRequestId: insertedRequest.id,
                orgId: organizationId,
                isMock: true
            }
        });

        revalidatePath("/accountant/sat-sync");

        return { success: true, message: "Sandbox de descarga masiva iniciado con éxito." };
    } catch (error) {
        console.error("Error in requestMockMassiveSync:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Error desconocido al solicitar el sandbox." };
    }
}

export async function getSatRequests(_clientOrgId?: string) {
    try {
        const cookieStore = await cookies();
        const organizationId = cookieStore.get('axioma_active_org')?.value;
        if (!organizationId) {
            throw new Error("No hay ninguna organización seleccionada en la sesión.");
        }

        const requests = await db.select()
            .from(satRequests)
            .where(eq(satRequests.organizationId, organizationId))
            .orderBy(desc(satRequests.createdAt))
            .limit(50);
        return { success: true, data: requests };
    } catch (error) {
        console.error("Error fetching sat requests:", error);
        return { success: false, error: "Error al obtener el historial de solicitudes." };
    }
}

export async function getOrganizationAccounts(organizationId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "No autenticado." };
        }

        const accounts = await db.select({
            id: financialAccounts.id,
            name: financialAccounts.name,
            currency: financialAccounts.currency,
        })
            .from(financialAccounts)
            .where(eq(financialAccounts.organizationId, organizationId));

        return { success: true, data: accounts };
    } catch (error) {
        console.error("Error fetching financial accounts:", error);
        return { success: false, error: "Error al obtener las cuentas financieras." };
    }
}

export type ConciliationResult = {
    uuid: string;
    type: string;
    rfc: string; // issuerRfc
    receiverRfc: string;
    issuerName?: string;
    receiverName?: string;
    issueDate: string;
    total: string;
    status: 'MISSING_IN_SYSTEM' | 'MISSING_IN_SAT' | 'MATCHED';
};

export async function processSatXmls(formData: FormData) {
    try {
        const organizationId = formData.get("organizationId") as string;
        if (!organizationId) {
            return { success: false, error: "ID de organización no proporcionado." };
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "No autenticado." };
        }

        // Multi-tenant check: User must be ACCOUNTANT or OWNER in this organization
        const { memberships } = await import("@/db/schema");
        const [membership] = await db.select()
            .from(memberships)
            .where(
                and(
                    eq(memberships.userId, user.id),
                    eq(memberships.organizationId, organizationId)
                )
            );

        if (!membership || (membership.role !== 'ACCOUNTANT' && membership.role !== 'OWNER')) {
            return { success: false, error: "No tienes permisos de contador en esta organización." };
        }

        const files = formData.getAll("files") as File[];
        if (!files || files.length === 0) {
            return { success: false, error: "No se proporcionaron archivos." };
        }

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "",
            parseAttributeValue: false,
        });

        // 1. Process uploaded XMLs
        const satXmlData = new Map<string, { uuid: string; type: string; rfc: string; receiverRfc: string; issuerName: string; receiverName: string; issueDate: string; total: string; }>();
        const satUuids: string[] = [];

        for (const file of files) {
            try {
                const xmlString = await file.text();
                const parsed = parser.parse(xmlString);

                const comprobante = parsed?.['cfdi:Comprobante'];
                if (!comprobante) continue;

                const emisor = comprobante['cfdi:Emisor'];
                const receptor = comprobante['cfdi:Receptor'];
                if (!emisor || !receptor) continue;

                const issuerRfc = emisor.Rfc;
                const receiverRfc = receptor.Rfc;
                const issuerName = emisor.Nombre || "";
                const receiverName = receptor.Nombre || "";
                const type = comprobante.TipoDeComprobante;
                const total = typeof comprobante.Total === 'number' ? comprobante.Total.toString() : (comprobante.Total || "0");
                const issueDateStr = comprobante.Fecha;

                let complementoObj = comprobante['cfdi:Complemento'];
                if (!complementoObj) continue;
                const complementoArray = Array.isArray(complementoObj) ? complementoObj : [complementoObj];

                let timbre: any = null;
                for (const comp of complementoArray) {
                    if (comp['tfd:TimbreFiscalDigital']) {
                        timbre = comp['tfd:TimbreFiscalDigital'];
                        break;
                    }
                }

                if (!timbre) continue;
                const timbreObj = Array.isArray(timbre) ? timbre[0] : timbre;
                const uuid = timbreObj.UUID?.toUpperCase();

                if (uuid) {
                    satXmlData.set(uuid, { uuid, type, rfc: issuerRfc, receiverRfc, issuerName, receiverName, issueDate: issueDateStr || '', total });
                    satUuids.push(uuid);
                }
            } catch (err) {
                console.error("Error parsing an XML file:", err);
            }
        }

        // 2. Fetch recorded UUIDs to skip processing for already matched XMLs
        const dbRecords = await db.select({
            uuid: fiscalDocuments.uuid,
            type: fiscalDocuments.type,
            issuerRfc: fiscalDocuments.issuerRfc,
            total: fiscalDocuments.total
        })
            .from(fiscalDocuments)
            .where(eq(fiscalDocuments.organizationId, organizationId));

        const matchedUuids = new Set<string>();
        for (const record of dbRecords) {
            if (record.uuid) {
                matchedUuids.add(record.uuid.toUpperCase());
            }
        }

        // 3. Fetch existing orders and treasury transactions to match against XMLs without UUID
        const existingOrders = await db.select({
            id: orders.id,
            totalAmount: orders.totalAmount,
            type: orders.type,
        })
            .from(orders)
            .where(
                and(
                    eq(orders.organizationId, organizationId),
                    eq(orders.status, 'CONFIRMED')
                )
            );

        const existingTreasury = await db.select({
            id: treasuryTransactions.id,
            amount: treasuryTransactions.amount,
            type: treasuryTransactions.type,
        })
            .from(treasuryTransactions)
            .where(eq(treasuryTransactions.organizationId, organizationId));

        const results: ConciliationResult[] = [];

        // Comparación cruzada
        for (const [uuid, satData] of satXmlData.entries()) {
            if (matchedUuids.has(uuid)) {
                // Ya existe en fiscal_documents, está conciliado
                results.push({ ...satData, status: 'MATCHED' });
                continue;
            }

            // Buscar en orders o treasuryTransactions con tolerancia de $1.00 MXN
            const xmlTotal = parseFloat(satData.total);
            let foundMatch = false;

            // Simple match for MVP: just try to match by amount and type (Ignorando RFC y fechas exactas por ahora para tolerancia flexible)
            if (satData.type === 'I') {
                // Try to find matching SALE order or INCOME treasury transaction
                for (const order of existingOrders) {
                    if (order.type === 'SALE' && Math.abs(parseFloat(order.totalAmount || "0") - xmlTotal) <= 1.0) {
                        foundMatch = true;
                        break;
                    }
                }
                if (!foundMatch) {
                    for (const tx of existingTreasury) {
                        if (tx.type === 'INCOME' && Math.abs(parseFloat(tx.amount || "0") - xmlTotal) <= 1.0) {
                            foundMatch = true;
                            break;
                        }
                    }
                }
            } else if (satData.type === 'E') {
                // Try to find matching PURCHASE order or EXPENSE treasury transaction
                for (const order of existingOrders) {
                    if (order.type === 'PURCHASE' && Math.abs(parseFloat(order.totalAmount || "0") - xmlTotal) <= 1.0) {
                        foundMatch = true;
                        break;
                    }
                }
                if (!foundMatch) {
                    for (const tx of existingTreasury) {
                        if (tx.type === 'EXPENSE' && Math.abs(parseFloat(tx.amount || "0") - xmlTotal) <= 1.0) {
                            foundMatch = true;
                            break;
                        }
                    }
                }
            }

            // Also consider the other case where the company is the receiver on an Income CFDI (which is an expense for the company)
            // But for standard UUID matching, amount check is enough fallback
            if (foundMatch) {
                results.push({ ...satData, status: 'MATCHED' });
            } else {
                results.push({ ...satData, status: 'MISSING_IN_SYSTEM' });
            }
        }

        // Faltantes en SAT no los calculamos rigurosamente para que no explote la memoria, 
        // a menos que comparemos cada orden con los UUIDs subidos. Omitido para MVP.

        return { success: true, data: results };

    } catch (error) {
        console.error("Error in processSatXmls:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Error desconocido al procesar la conciliación de XMLs." };
    }
}

export async function registerMissingCfdi(data: {
    xmlData: any,
    organizationId: string,
    accountId?: string,
    category?: 'SALE' | 'PURCHASE' | 'PAYROLL' | 'OPERATING_EXPENSE' | 'TAX' | 'CAPITAL'
}) {
    try {
        const { xmlData, organizationId, accountId, category } = data;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "No autenticado." };
        }

        // Obtener el RFC de la empresa
        const [org] = await db.select().from(organizations).where(eq(organizations.id, organizationId));
        if (!org || !org.taxId) {
            return { success: false, error: "La organización no tiene un RFC configurado para validar la transacción." };
        }

        const orgRfc = org.taxId.toUpperCase();
        const issuerRfc = xmlData.rfc?.toUpperCase();
        const receiverRfc = xmlData.receiverRfc?.toUpperCase();
        const xmlTotal = parseFloat(xmlData.total);

        // Necesitamos una cuenta de banco para registrar
        let selectedAccountId = accountId;
        if (!selectedAccountId) {
            const [defaultAccount] = await db.select().from(financialAccounts)
                .where(eq(financialAccounts.organizationId, organizationId))
                .limit(1);

            if (!defaultAccount) {
                return { success: false, error: "Debes crear al menos una cuenta financiera en Tesorería antes de registrar operaciones de conciliación." };
            }
            selectedAccountId = defaultAccount.id;
        }

        // Determinar si es un Ingreso o Egreso para la empresa
        let txType: 'INCOME' | 'EXPENSE' = 'INCOME';
        let txCategory: 'SALE' | 'PURCHASE' | 'PAYROLL' | 'OPERATING_EXPENSE' | 'TAX' | 'CAPITAL' = category || 'SALE';

        if (xmlData.type === 'I') {
            if (issuerRfc === orgRfc) {
                // Factura emitida por la empresa -> Ingreso / Venta
                txType = 'INCOME';
                txCategory = category || 'SALE';
            } else if (receiverRfc === orgRfc) {
                // Factura recibida por la empresa -> Gasto / Compra
                txType = 'EXPENSE';
                txCategory = category || 'OPERATING_EXPENSE';
            }
        } else if (xmlData.type === 'E') {
            // Nota de crédito emitida por la empresa -> Egreso
            if (issuerRfc === orgRfc) {
                txType = 'EXPENSE';
                txCategory = category || 'OPERATING_EXPENSE';
            } else {
                txType = 'INCOME';
                txCategory = category || 'SALE';
            }
        }

        const dateToUse = xmlData.issueDate ? new Date(xmlData.issueDate) : new Date();

        // 1. Registrar en Tesorería
        const [tx] = await db.insert(treasuryTransactions).values({
            organizationId,
            accountId: selectedAccountId,
            type: txType,
            category: txCategory,
            amount: xmlTotal.toString(),
            description: `Registro automatizado desde conciliación SAT - ${issuerRfc || 'Desconocido'}`,
            date: dateToUse,
            createdBy: user.id
        }).returning({ id: treasuryTransactions.id });

        // 2. Registrar el documento en fiscal_documents
        await db.insert(fiscalDocuments).values({
            organizationId,
            uuid: xmlData.uuid,
            issuerRfc: issuerRfc || null,
            receiverRfc: receiverRfc || null,
            issueDate: dateToUse,
            type: xmlData.type as any,
            total: xmlTotal.toString(),
        });

        revalidatePath("/accountant/sat-sync");
        revalidatePath("/dashboard/treasury");

        return { success: true, message: "Factura registrada e conciliada correctamente." };
    } catch (error) {
        console.error("Error in registerMissingCfdi:", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Error desconocido al registrar el CFDI." };
    }
}
