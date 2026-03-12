"use server";

import { db } from "@/db";
import { fiscalDocuments, orders } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getActiveOrgId } from "@/lib/accountant/context";

export type ReconciliationState = "CONCILIADO" | "HUÉRFANO SAT" | "HUÉRFANO ERP";

export type ReconciledItem = {
    id: string; // uuid for React key
    date: Date;
    rfc: string;
    name: string;
    amount: number;
    type: "Ingreso" | "Egreso" | "Desconocido";
    state: ReconciliationState;
    sourceSatId?: string; // fiscal_documents id
    sourceErpId?: string; // orders id
    satUuid?: string;
};

export async function getReconciliationData(month: number, year: number) {
    try {
        const orgId = await getActiveOrgId();

        const periodStart = new Date(year, month - 1, 1);
        const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

        // Fetch SAT Documents (temporalmente sin filtro de fechas)
        const satDocs = await db.query.fiscalDocuments.findMany({
            where: eq(fiscalDocuments.organizationId, orgId)
        });

        console.log("================ DIAGNÓSTICO DE CONCILIACIÓN ================");
        console.log("Org activa (Contexto Inngest - Request):", orgId);
        console.log("Periodo Solicitado:", { periodStart, periodEnd });
        console.log("Documentos (SAT) encontrados (Sin filtro de fecha):", satDocs.length);
        if (satDocs.length > 0) {
            console.log("Ejemplo de fecha XML parseada:", satDocs[0].issueDate, typeof satDocs[0].issueDate);
        }

        // Fetch ERP Orders
        const erpOrders = await db.query.orders.findMany({
            where: and(
                eq(orders.organizationId, orgId),
                gte(orders.createdAt, periodStart),
                lte(orders.createdAt, periodEnd)
            ),
            with: {
                entity: true
            }
        });

        const items: ReconciledItem[] = [];

        // --- MATCHING ALGORITHM ---
        const matchedSatIds = new Set<string>();
        const matchedErpIds = new Set<string>();

        // First pass: match by exact amount and type
        for (const satDoc of satDocs) {
            const satType = satDoc.type === "I" ? "Ingreso" : satDoc.type === "E" ? "Egreso" : "Desconocido";
            if (satType === "Desconocido") continue; // Skip N/P types for basic reco

            const satAmount = parseFloat(satDoc.total || "0");

            let matchedOrder = null;
            for (const order of erpOrders) {
                if (matchedErpIds.has(order.id)) continue;

                const orderType = order.type === "SALE" ? "Ingreso" : "Egreso";
                if (orderType !== satType) continue;

                const orderAmount = parseFloat(order.totalAmount || "0");

                // Allow up to 1 unit variance for decimals
                if (Math.abs(satAmount - orderAmount) <= 1) {
                    matchedOrder = order;
                    break;
                }
            }

            if (matchedOrder) {
                matchedSatIds.add(satDoc.id);
                matchedErpIds.add(matchedOrder.id);

                items.push({
                    id: `conciliado-${satDoc.id}-${matchedOrder.id}`,
                    date: satDoc.issueDate || matchedOrder.createdAt,
                    rfc: satDoc.type === "I" ? satDoc.receiverRfc || "S/N" : satDoc.issuerRfc || "S/N",
                    name: matchedOrder.entity?.commercialName || "Desconocido",
                    amount: satAmount,
                    type: satType,
                    state: "CONCILIADO",
                    sourceSatId: satDoc.id,
                    sourceErpId: matchedOrder.id,
                    satUuid: satDoc.uuid,
                });
            } else {
                items.push({
                    id: `sat-${satDoc.id}`,
                    date: satDoc.issueDate!,
                    rfc: satDoc.type === "I" ? satDoc.receiverRfc || "S/N" : satDoc.issuerRfc || "S/N",
                    name: "Desconocido (Falta captura en ERP)",
                    amount: satAmount,
                    type: satType,
                    state: "HUÉRFANO SAT",
                    sourceSatId: satDoc.id,
                    satUuid: satDoc.uuid,
                });
            }
        }

        // Second pass: remaining ERP Orders
        for (const order of erpOrders) {
            if (matchedErpIds.has(order.id)) continue;

            const orderType = order.type === "SALE" ? "Ingreso" : "Egreso";
            items.push({
                id: `erp-${order.id}`,
                date: order.createdAt,
                rfc: order.entity?.taxId || "S/N",
                name: order.entity?.commercialName || "Desconocido",
                amount: parseFloat(order.totalAmount || "0"),
                type: orderType,
                state: "HUÉRFANO ERP",
                sourceErpId: order.id,
            });
        }

        // Sort descending by date
        items.sort((a, b) => b.date.getTime() - a.date.getTime());

        return { success: true, data: items };

    } catch (error) {
        console.error("Error fetching reconciliation data:", error);
        return { success: false, error: "Error al obtener datos de conciliación." };
    }
}
