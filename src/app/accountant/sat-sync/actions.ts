"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { fiscalDocuments, satRequests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { processAndStoreCFDI } from "@/lib/sat/cfdi-processor";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client for server-side trusted operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function uploadManualXML(formData: FormData, organizationId: string) {
    try {
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

import { getActiveOrgId } from "@/lib/accountant/context";
import { inngest } from "@/lib/inngest/client";

export async function requestMassiveSync(month: number, year: number) {
    try {
        const organizationId = await getActiveOrgId();

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

export async function getSatRequests(organizationId: string) {
    try {
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
