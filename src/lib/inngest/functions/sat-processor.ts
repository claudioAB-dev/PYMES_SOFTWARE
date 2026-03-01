import { inngest } from "../client";
import { db } from "@/db";
import { satRequests } from "@/db/schema";
import { eq } from "drizzle-orm";

export const processMassiveSatDownload = inngest.createFunction(
    { id: "process-massive-sat-download", name: "Process Massive SAT Download" },
    { event: "sat/download.completed" },
    async ({ event, step }) => {
        const { satRequestId, organizationId, zipUrl } = event.data;

        // a) Cambiar el estado del sat_request en la base de datos a 'PROCESSING'
        await step.run("update-status-processing", async () => {
            await db
                .update(satRequests)
                .set({ status: 'PROCESSING', updatedAt: new Date() })
                .where(eq(satRequests.id, satRequestId));
        });

        // b) Escribir un esqueleto (comentarios detallados) de los pasos simulados
        await step.run("download-and-extract-zip", async () => {
            // 1. Descargar el archivo ZIP desde la url temporal (zipUrl)
            // const response = await fetch(zipUrl);
            // const arrayBuffer = await response.arrayBuffer();
            // const buffer = Buffer.from(arrayBuffer);

            // 2. Extraer en memoria usando adm-zip
            // const AdmZip = (await import('adm-zip')).default;
            // const zip = new AdmZip(buffer);
            // const zipEntries = zip.getEntries();

            // 3. Iterar sobre las entradas y procesar los XMLs
            // let processedCount = 0;
            // for (const zipEntry of zipEntries) {
            //   if (zipEntry.name.toUpperCase().endsWith('.XML')) {
            //     const xmlBuffer = zipEntry.getData();
            //     const xmlString = xmlBuffer.toString('utf8');

            //     // Invocar nuestro procesador existente
            //     // await processAndStoreCFDI(xmlString, organizationId);
            //     processedCount++;
            //   }
            // }

            console.log(`[SAT Worker] Simulación: Archivos dentro del ZIP de url ${zipUrl}`);
            console.log(`[SAT Worker] Request ID procesado: ${satRequestId} de la organización ${organizationId}`);

            // return { processedCount };
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
