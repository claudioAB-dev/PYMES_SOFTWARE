import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleDollarSign, TrendingDown, TrendingUp, Building2, Download } from "lucide-react";
import { InvoicesTable, FiscalDocument } from "./invoices-table";

export const metadata: Metadata = {
    title: "Bóveda Fiscal | Axioma",
    description: "Bóveda Fiscal para consulta de CFDI sincronizados del SAT",
};

// Datos simulados para demostración visual
// En un entorno real, estos vendrían de `db.select().from(fiscalDocuments).where(...)`
const mockDocuments: FiscalDocument[] = [
    {
        id: "uuid-1",
        uuid: "9D2B8A04-1234-4567-890A-BCDEF0123456",
        issuerRfc: "SAOS890812F32",
        receiverRfc: "AXI123456XYZ",
        issueDate: new Date("2024-03-15T10:30:00Z"),
        type: "I",
        subtotal: 15000.0,
        tax: 2400.0,
        total: 17400.0,
    },
    {
        id: "uuid-2",
        uuid: "1A2B3C4D-5E6F-7G8H-9I0J-K1L2M3N4O5P6",
        issuerRfc: "AXI123456XYZ",
        receiverRfc: "PROV987654ABC",
        issueDate: new Date("2024-03-20T14:45:00Z"),
        type: "E",
        subtotal: 5000.0,
        tax: 800.0,
        total: 5800.0,
    },
    {
        id: "uuid-3",
        uuid: "F7E8D9C0-B1A2-9384-7564-534231201918",
        issuerRfc: "NOM123456789",
        receiverRfc: "EMP987654321",
        issueDate: new Date("2024-03-25T09:00:00Z"),
        type: "N",
        subtotal: 12000.0,
        tax: 0.0,
        total: 12000.0,
    },
    {
        id: "uuid-4",
        uuid: "3R4S5T6U-7V8W-9X0Y-1Z2A-3B4C5D6E7F8G",
        issuerRfc: "SAOS890812F32",
        receiverRfc: "AXI123456XYZ",
        issueDate: new Date("2024-03-28T16:20:00Z"),
        type: "I",
        subtotal: 2500.0,
        tax: 400.0,
        total: 2900.0,
    },
    {
        id: "uuid-5",
        uuid: "8H9I0J1K-2L3M-4N5O-6P7Q-8R9S0T1U2V3W",
        issuerRfc: "AXI123456XYZ",
        receiverRfc: "SERV456789DEF",
        issueDate: new Date("2024-04-02T11:15:00Z"),
        type: "E",
        subtotal: 3200.0,
        tax: 512.0,
        total: 3712.0,
    }
];

export default async function InvoicesPage() {
    // Simulando obtención de datos (DB query futura)
    const documents = mockDocuments;

    // Cálculos para KPIs (Simulados)
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
