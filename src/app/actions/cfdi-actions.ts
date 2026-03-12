"use server";

import { db } from "@/db";
import { orders, memberships } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getOrganizationId() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const userMemberships = await db.query.memberships.findMany({
        where: eq(memberships.userId, user.id),
    });

    if (userMemberships.length === 0) {
        throw new Error("No organization found");
    }

    return {
        organizationId: userMemberships[0].organizationId,
        role: userMemberships[0].role,
        user
    };
}

export async function uploadCfdiAction(formData: FormData) {
    try {
        const { organizationId } = await getOrganizationId();

        const orderId = formData.get("orderId") as string;
        const pdfFile = formData.get("pdf") as File | null;
        const xmlFile = formData.get("xml") as File | null;
        const transactionType = formData.get("transactionType") as string || "sale";

        if (!orderId) {
            throw new Error("Falta el ID de la orden.");
        }

        if (!pdfFile && !xmlFile) {
            throw new Error("Debes proporcionar al menos un archivo PDF o XML.");
        }

        // Verify order exists and belongs to the organization
        const order = await db.query.orders.findFirst({
            where: and(
                eq(orders.id, orderId),
                eq(orders.organizationId, organizationId)
            )
        });

        if (!order) {
            throw new Error("Orden no encontrada o acceso denegado.");
        }

        const supabase = await createClient();
        let pdfPath = order.cfdiPdfPath;
        let xmlPath = order.cfdiXmlPath;

        const uploadFile = async (file: File, extension: string) => {
            const fileName = `${organizationId}/${transactionType}/${orderId}/${orderId}.${extension}`;
            const { data, error } = await supabase.storage
                .from("invoices")
                .upload(fileName, file, {
                    upsert: true,
                    contentType: file.type,
                });

            if (error) {
                console.error(`Supabase Storage Upload Error (${extension}):`, error);
                throw new Error(`Error subiendo el archivo ${extension.toUpperCase()}`);
            }
            return data.path;
        };

        if (pdfFile) {
            pdfPath = await uploadFile(pdfFile, "pdf");
        }

        if (xmlFile) {
            xmlPath = await uploadFile(xmlFile, "xml");
        }

        // Update database record
        await db.update(orders)
            .set({
                invoiceStatus: "attached",
                cfdiPdfPath: pdfPath,
                cfdiXmlPath: xmlPath,
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(orders.id, orderId),
                    eq(orders.organizationId, organizationId)
                )
            );

        revalidatePath(`/dashboard/reconciliation`);
        revalidatePath(`/dashboard/sales/${orderId}`);
        revalidatePath(`/dashboard/purchases/${orderId}`);

        return { success: true, message: "Archivos CFDI adjuntados correctamente." };

    } catch (error: any) {
        console.error("Error en uploadCfdiAction:", error);
        return { success: false, error: error.message || "Error al procesar la subida." };
    }
}

export async function getCfdiDownloadUrlAction(orderId: string, type: 'pdf' | 'xml') {
    try {
        const { organizationId } = await getOrganizationId();

        const order = await db.query.orders.findFirst({
            where: and(
                eq(orders.id, orderId),
                eq(orders.organizationId, organizationId)
            )
        });

        if (!order) {
            throw new Error("Orden no encontrada o acceso denegado.");
        }

        const path = type === 'pdf' ? order.cfdiPdfPath : order.cfdiXmlPath;

        if (!path) {
            throw new Error(`No hay archivo ${type.toUpperCase()} adjunto.`);
        }

        const supabase = await createClient();

        // Expiration time 60 seconds
        const { data, error } = await supabase.storage
            .from("invoices")
            .createSignedUrl(path, 60);

        if (error || !data) {
            console.error("URL Sign Error:", error);
            throw new Error("No se pudo generar el enlace de descarga.");
        }

        return { success: true, url: data.signedUrl };
    } catch (error: any) {
        console.error("Error en getCfdiDownloadUrlAction:", error);
        return { success: false, error: error.message || "Error al generar descarga." };
    }
}
