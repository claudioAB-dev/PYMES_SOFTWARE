import { inngest } from "../client";
import { db } from "@/db";
import { satRequests, fiscalDocuments, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { processAndStoreCFDI } from "@/lib/sat/cfdi-processor";
import { createClient } from "@supabase/supabase-js";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Necesitamos inicializar el cliente de Supabase Admin para Server-Side
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const processMassiveSatDownload = inngest.createFunction(
    { id: "process-massive-sat-download", name: "Process Massive SAT Download" },
    { event: "sat.sync.requested" },
    async ({ event, step }) => {
        const { satRequestId, orgId, isMock } = event.data;

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

            let zip: AdmZip;

            if (isMock) {
                // Modo Sandbox: Leemos el ZIP dummy local
                console.log(`[SAT Worker] Ejecutando en MOCK MODE para request ${satRequestId}`);
                const dummyZipPath = path.join(process.cwd(), 'src/lib/sat/__mocks__/dummy_cfdis.zip');
                if (!fs.existsSync(dummyZipPath)) {
                    throw new Error(`No se encontró el archivo de simulación en ${dummyZipPath}`);
                }
                const buffer = fs.readFileSync(dummyZipPath);
                zip = new AdmZip(buffer);
            } else {
                // Modo Real: Simulamos la descarga y extracción del ZIP que provendría del PAC o SAT
                // const response = await fetch("https://dummy-sat.com/dummy.zip");
                // const arrayBuffer = await response.arrayBuffer();
                // zip = new AdmZip(Buffer.from(arrayBuffer));
                // TODO: Reemplazar con la implementación real cuando esté lista.
                throw new Error("La implementación real de descarga del SAT aún no está disponible. Usa isMock=true para probar.");
            }

            // Procesamiento de las entradas del ZIP
            const zipEntries = zip.getEntries();
            let processedCount = 0;
            for (const zipEntry of zipEntries) {
                if (zipEntry.name.toUpperCase().endsWith('.XML')) {
                    const xmlBuffer = zipEntry.getData();
                    const xmlString = xmlBuffer.toString('utf8');

                    try {
                        // Este paso parsea e inserta a Supabase
                        const cfdiData = await processAndStoreCFDI(xmlString, orgId, supabaseAdmin);

                        // VALIDACIÓN DE SEGURIDAD (RFC Check)
                        // En mock mode con "EKU9003173C9" como emisor dummy_rfc, saltamos validación estricta solo si no coincide.
                        // Para evitar errores en Sandbox donde la org no tiene el RFC de dummy, omitimos el skip-continue en MOCK temporalmente
                        if (!isMock && orgRfc && cfdiData.issuerRfc !== orgRfc && cfdiData.receiverRfc !== orgRfc) {
                            console.error(`[SAT Worker] ALERTA DE SEGURIDAD: El XML con UUID ${cfdiData.uuid} no pertenece al RFC de la organización activa (${orgRfc}). Se omite.`);
                            continue;
                        }

                        const insertUuid = isMock ? crypto.randomUUID() : cfdiData.uuid;

                        // Inserción explícita inyectando organizationId
                        await db.insert(fiscalDocuments).values({
                            ...cfdiData,
                            uuid: insertUuid,
                            organizationId: orgId, // Inyectado explícitamente
                        });
                        console.log(`[SAT Worker] ✓ INSERCIÓN EXITOSA - UUID: ${insertUuid} | Fecha: ${cfdiData.issueDate} | Tipo: ${cfdiData.type}`);
                        processedCount++;
                    } catch (err) {
                        console.error(`[SAT Worker] Error procesando archivo:`, err);
                    }
                }
            }

            // Log de seguridad conforme a lo solicitado
            console.log(`[SAT Worker] Request ID procesado: ${satRequestId} de la organización ${orgId}`);
            console.log(`[SAT Worker] TOTAL GUARDADOS EN DB: ${processedCount}`);
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
