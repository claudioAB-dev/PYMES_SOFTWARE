import { getFinancialAccounts, getCashFlowSummary, getTotalBalance } from "./actions";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { NewTransactionSheet } from "./new-transaction-sheet";
import { CreateAccountSheet } from "./create-account-sheet";
import { DirectExpenseSheet } from "@/components/treasury/direct-expense-sheet";
import { FinancialAccountsGrid } from "./financial-accounts-grid";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function TreasuryPage() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [accounts, totalBalance, cashFlow] = await Promise.all([
        getFinancialAccounts(),
        getTotalBalance(),
        getCashFlowSummary(startOfMonth, today),
    ]);

    const income = cashFlow?.totalIncome || 0;
    const expense = cashFlow?.totalExpense || 0;
    const netCashFlow = cashFlow?.netCashFlow || 0;
    const transactions = cashFlow?.transactions || [];

    const getCategoryLabel = (cat: string) => {
        const labels: Record<string, string> = {
            'SALE': 'Venta',
            'PURCHASE': 'Compra',
            'PAYROLL': 'Nómina',
            'OPERATING_EXPENSE': 'Operativo',
            'TAX': 'Impuestos',
            'CAPITAL': 'Capital'
        };
        return labels[cat] || cat;
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tesorería y Flujo de Caja</h1>
                    <p className="text-muted-foreground">Resume el estado financiero, cuentas y movimientos recientes.</p>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                    <CreateAccountSheet />
                    <DirectExpenseSheet accounts={accounts.filter(a => a.isActive)} />
                    <NewTransactionSheet accounts={accounts.filter(a => a.isActive)} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Balance Total en Cuentas</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Flujo Neto (Mes Actual)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {netCashFlow > 0 ? "+" : ""}{formatCurrency(netCashFlow)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos (Mes Actual)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(income)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Egresos (Mes Actual)</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(expense)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Cuentas Financieras Grid */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">Cuentas Financieras</h2>
                <FinancialAccountsGrid accounts={accounts} />
            </div>

            {/* Movimientos Recientes */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">Movimientos Recientes</h2>
                <Card>
                    <CardContent className="p-0">
                        {transactions.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No hay transacciones registradas este mes.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-6">Fecha</TableHead>
                                        <TableHead>Descripción / Ref</TableHead>
                                        <TableHead>Cuenta</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead className="text-right pr-6">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.slice(0, 10).map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell className="pl-6">{format(new Date(t.date), "dd/MM/yyyy HH:mm")}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">{t.description}</TableCell>
                                            <TableCell>{t.account.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{getCategoryLabel(t.category)}</Badge>
                                            </TableCell>
                                            <TableCell className={`text-right font-bold pr-6 ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
