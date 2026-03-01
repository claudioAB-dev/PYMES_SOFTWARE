import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleDollarSign, TrendingDown, TrendingUp, Building2, Download } from "lucide-react";
import { InvoicesTable, FiscalDocument } from "./invoices-table";
import { ExportButton } from "./export-button";

export const metadata: Metadata = {
    title: "Bóveda Fiscal | Axioma",
    description: "Bóveda Fiscal para consulta de CFDI sincronizados del SAT",
};

// Datos obtenidos de la DB mediante Drizzle ORM
import { cookies } from "next/headers";
import { getActiveOrgId, validateAccountantAccess } from "@/lib/accountant/context";
import { db } from "@/db";
import { fiscalDocuments } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function InvoicesPage() {
    const organizationId = await getActiveOrgId();
    await validateAccountantAccess(organizationId);

    // Fetching data from the DB filtering strictly by organization_id
    const data = await db.query.fiscalDocuments.findMany({
        where: eq(fiscalDocuments.organizationId, organizationId)
    });

    const documents: FiscalDocument[] = data.map(doc => ({
        id: doc.id,
        uuid: doc.uuid,
        issuerRfc: doc.issuerRfc || "",
        receiverRfc: doc.receiverRfc || "",
        issueDate: doc.issueDate || new Date(),
        type: (doc.type || "I") as FiscalDocument["type"],
        subtotal: parseFloat(doc.subtotal?.toString() || "0"),
        tax: parseFloat(doc.tax?.toString() || "0"),
        total: parseFloat(doc.total?.toString() || "0"),
    }));

    // Cálculos para KPIs
    const totalIngresos = documents
        .filter((doc) => doc.type === "I")
        .reduce((sum, doc) => sum + doc.total, 0);

    const totalEgresos = documents
        .filter((doc) => doc.type === "E")
        .reduce((sum, doc) => sum + doc.total, 0);

    const totalImpuestos = documents.reduce((sum, doc) => sum + doc.tax, 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
        }).format(amount);
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        Bóveda Fiscal - CFDI
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Visualiza y administra todos los comprobantes fiscales extraídos y sincronizados desde el SAT.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <ExportButton orgId={organizationId} />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 font-sans">
                            Total Ingresos (I)
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(totalIngresos)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Suma del total de comprobantes tipo Ingreso
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 font-sans">
                            Total Egresos (E)
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(totalEgresos)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Suma del total de comprobantes tipo Egreso
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 font-sans">
                            Impuestos Trasladados
                        </CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <CircleDollarSign className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(totalImpuestos)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Suma total de impuestos en todos los comprobantes
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabla Interactiva */}
            <div className="mt-8">
                <InvoicesTable data={documents} />
            </div>
        </div>
    );
}
