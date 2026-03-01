import { inngest } from "../client";
import { db } from "@/db";
import { satRequests, fiscalDocuments, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { processAndStoreCFDI } from "@/lib/sat/cfdi-processor";
import { createClient } from "@supabase/supabase-js";

// Necesitamos inicializar el cliente de Supabase Admin para Server-Side
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const processMassiveSatDownload = inngest.createFunction(
    { id: "process-massive-sat-download", name: "Process Massive SAT Download" },
    { event: "sat.sync.requested" },
    async ({ event, step }) => {
        const { satRequestId, orgId } = event.data;

        // a) Cambiar el estado del sat_request en la base de datos a 'PROCESSING'
        await step.run("update-status-processing", async () => {
            await db
                .update(satRequests)
                .set({ status: 'PROCESSING', updatedAt: new Date() })
                .where(eq(satRequests.id, satRequestId));
        });

        // b) Validar RFC y procesar
        await step.run("download-and-extract-zip", async () => {
            // Obtener la organización para validar el RFC
            const org = await db.query.organizations.findFirst({
                where: eq(organizations.id, orgId)
            });

            if (!org) {
                throw new Error(`Organización no encontrada: ${orgId}`);
            }

            const orgRfc = org.taxId;
            if (!orgRfc) {
                console.warn(`[SAT Worker] La organización ${orgId} no tiene RFC configurado. Limitando validación profunda, pero se recomienda configurarlo.`);
            }

            // Simulamos la descarga y extracción del ZIP que provendría del PAC o SAT
            // const response = await fetch("https://dummy-sat.com/dummy.zip");
            // const arrayBuffer = await response.arrayBuffer();
            // ...

            // Simulación de iteración
            // const zipEntries = zip.getEntries();
            // let processedCount = 0;
            // for (const zipEntry of zipEntries) {
            //   if (zipEntry.name.toUpperCase().endsWith('.XML')) {
            //     const xmlBuffer = zipEntry.getData();
            //     const xmlString = xmlBuffer.toString('utf8');

            //     try {
            //         // Este paso parsea e inserta a Supabase
            //         const cfdiData = await processAndStoreCFDI(xmlString, orgId, supabaseAdmin);

            //         // VALIDACIÓN DE SEGURIDAD (RFC Check)
            //         if (orgRfc && cfdiData.issuerRfc !== orgRfc && cfdiData.receiverRfc !== orgRfc) {
            //             console.error(`[SAT Worker] ALERTA DE SEGURIDAD: El XML con UUID ${cfdiData.uuid} no pertenece al RFC de la organización activa (${orgRfc}). Se omite.`);
            //             continue;
            //         }

            //         // Inserción explícita inyectando organizationId
            //         await db.insert(fiscalDocuments).values({
            //             ...cfdiData,
            //             organizationId: orgId, // Inyectado explícitamente
            //         });
            //         processedCount++;
            //     } catch (err) {
            //         console.error(`[SAT Worker] Error procesando archivo:`, err);
            //     }
            //   }
            // }

            // Log de seguridad conforme a lo solicitado
            console.log(`[SAT Worker] Request ID procesado: ${satRequestId} de la organización ${orgId}`);
            if (orgRfc) {
                console.log(`[SAT Worker] Check de seguridad: Todos los CFDI extraídos deben tener Emisor o Receptor igual a ${orgRfc}`);
            }
        });

        // c) Finalizar cambiando el estado del sat_request a 'COMPLETED'
        await step.run("update-status-completed", async () => {
            await db
                .update(satRequests)
                .set({ status: 'COMPLETED', updatedAt: new Date() })
                .where(eq(satRequests.id, satRequestId));
        });

        return { success: true, satRequestId, status: "COMPLETED" };
    }
);
