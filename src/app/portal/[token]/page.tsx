import { db } from "@/db";
import { entities, receivables, orders, organizations } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckCircle, FileText, BadgeDollarSign, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PortalPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function PortalPage({ params }: PortalPageProps) {
  const { token } = await params;

  // Validate token is a UUID (basic length check to prevent random crashes if DB expects UUID format)
  if (!token || token.length !== 36) {
    return notFound();
  }

  // Fetch the entity to get the name
  const [entity] = await db
    .select({
      id: entities.id,
      commercialName: entities.commercialName,
      legalName: entities.legalName,
      type: entities.type,
      organizationName: organizations.name,
      organizationEmail: organizations.email,
    })
    .from(entities)
    .innerJoin(organizations, eq(entities.organizationId, organizations.id))
    .where(eq(entities.id, token));

  if (!entity) {
    return notFound();
  }

  // Fetch the current receivables and join with orders to show concept
  const data = await db
    .select({
      id: receivables.id,
      amount: receivables.amount,
      balance: receivables.balance,
      status: receivables.status,
      issueDate: receivables.issueDate,
      dueDate: receivables.dueDate,
      orderConcept: orders.concept,
    })
    .from(receivables)
    .leftJoin(orders, eq(orders.id, receivables.orderId))
    .where(eq(receivables.entityId, token))
    .orderBy(asc(receivables.dueDate));

  // Determine the name to show
  const clientName = entity.commercialName || entity.legalName || "Cliente";

  // Calculate total balance
  const totalBalance = data.reduce((acc, curr) => {
    // Considering UNPAID and PARTIAL have pending balances
    if (curr.status === "UNPAID" || curr.status === "PARTIAL") {
      return acc + Number(curr.balance);
    }
    return acc;
  }, 0);

  // Format currency
  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(Number(value));
  };

  const isOverdue = (date: Date) => {
    return new Date() > new Date(date);
  };

  const pendingReceivables = data.filter((r) => r.status === 'UNPAID' || r.status === 'PARTIAL');

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-12">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Estado de Cuenta generado por {entity.organizationName}
            </h1>
            <p className="text-lg text-slate-500 mt-2">
              Cliente: <span className="font-medium text-slate-800">{clientName}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            {entity.organizationEmail && (
              <a href={`mailto:${entity.organizationEmail}?subject=Aviso%20de%20Pago%20-%20${encodeURIComponent(clientName)}`}>
                <Button variant="outline" className="shadow-sm">
                  Notificar Pago
                </Button>
              </a>
            )}
            <div className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
              <CalendarDays className="h-4 w-4" />
              Actualizado: {format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm border-l-4 border-l-blue-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Saldo Total Pendiente
              </CardTitle>
              <BadgeDollarSign className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {formatCurrency(totalBalance)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Suma de todos los saldos por pagar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Detalle de Facturas y Órdenes</h2>
          
          {pendingReceivables.length > 0 ? (
            <Card className="shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Fecha de Emisión</TableHead>
                    <TableHead>Fecha de Vencimiento</TableHead>
                    <TableHead className="text-right">Monto Original</TableHead>
                    <TableHead className="text-right">Saldo Pendiente</TableHead>
                    <TableHead className="w-[120px] text-center">Estatus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReceivables.map((item) => {
                    const overdue = isOverdue(item.dueDate);
                    return (
                      <TableRow key={item.id} className="group hover:bg-slate-50/80 transition-colors">
                        <TableCell className="font-medium text-slate-900 border-l-[3px] border-transparent" style={{ borderColor: overdue ? '#ef4444' : 'transparent' }}>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" />
                            {item.orderConcept || `Cuenta por cobrar: ${item.id.slice(0, 8)}`}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {format(item.issueDate, "dd MMM, yyyy", { locale: es })}
                        </TableCell>
                        <TableCell className={overdue ? "text-red-600 font-medium" : "text-slate-600"}>
                          {format(item.dueDate, "dd MMM, yyyy", { locale: es })}
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          {formatCurrency(item.balance)}
                        </TableCell>
                        <TableCell className="text-center">
                          {overdue ? (
                            <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100/80 shadow-none border-red-200">
                              Vencido
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100/80 shadow-none border-amber-200">
                              Pendiente
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="border-dashed shadow-none bg-slate-50/50">
              <EmptyState
                icon={CheckCircle}
                title="¡Todo al corriente!"
                description={`${clientName} no tiene facturas ni órdenes pendientes de pago en este momento. El saldo está en cero.`}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
