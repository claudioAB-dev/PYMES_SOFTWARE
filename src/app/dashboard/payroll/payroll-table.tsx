"use client";

import { useState, useTransition } from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { payPayroll } from "../hr/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Download, FileText, Plus, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";

export type Payroll = {
    id: string;
    organizationId: string;
    employeeId: string;
    periodStart: Date;
    periodEnd: Date;
    grossAmount: string;
    deductions: string;
    netAmount: string;
    status: "DRAFT" | "APPROVED" | "PAID";
    paymentDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    employee: {
        firstName: string;
        lastName: string;
        taxId: string | null;
    };
};

const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value));
}

const translateStatus = (status: string) => {
    switch (status) {
        case 'DRAFT': return 'Borrador';
        case 'APPROVED': return 'Aprobada';
        case 'PAID': return 'Pagada';
        default: return status;
    }
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'DRAFT': return 'bg-yellow-500 hover:bg-yellow-600';
        case 'APPROVED': return 'bg-blue-500 hover:bg-blue-600';
        case 'PAID': return 'bg-emerald-500 hover:bg-emerald-600';
        default: return 'bg-gray-500';
    }
}

function PayrollActionCell({ payroll, financialAccounts }: { payroll: Payroll, financialAccounts: any[] }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm({
        defaultValues: {
            payments: [{ accountId: "", amount: Number(payroll.netAmount) }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "payments"
    });

    const formPayments = form.watch("payments");
    const totalAssigned = formPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const remaining = Number(payroll.netAmount) - totalAssigned;

    const handlePay = form.handleSubmit((data) => {
        if (Math.abs(remaining) > 0.01) {
            toast.error("El monto asignado no coincide exactamente con el neto a pagar.");
            return;
        }

        if (data.payments.some(p => !p.accountId)) {
            toast.error("Todas las filas deben tener una cuenta seleccionada.");
            return;
        }

        startTransition(async () => {
            const result = await payPayroll(payroll.id, data.payments);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Nómina pagada correctamente.");
                setIsDialogOpen(false);
                router.refresh();
            }
        });
    });

    if (payroll.status === 'PAID') {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                        <a href={`/api/documents/payrolls/${payroll.id}/pdf`} target="_blank">
                            <FileText className="mr-2 h-4 w-4" />
                            Descargar Recibo (PDF)
                        </a>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                        <a href={`/api/documents/payrolls/${payroll.id}/pdf`} target="_blank">
                            <FileText className="mr-2 h-4 w-4" />
                            Descargar Recibo (PDF)
                        </a>
                    </DropdownMenuItem>
                    <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <span className="text-emerald-600 font-medium">Pagar Nómina</span>
                        </DropdownMenuItem>
                    </DialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>

            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Pagar Nómina</DialogTitle>
                    <DialogDescription>
                        Descuenta el neto de {formatCurrency(payroll.netAmount)} de tus cuentas financieras.
                        Puedes dividir el pago en múltiples cuentas.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handlePay} className="space-y-4">
                        <div className="space-y-4 max-h-[400px] overflow-y-auto p-1">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-2 items-end">
                                    <FormField
                                        control={form.control}
                                        name={`payments.${index}.accountId`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Cuenta" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {financialAccounts.map((acc: any) => (
                                                            <SelectItem key={acc.id} value={acc.id}>
                                                                {acc.name} ({formatCurrency(acc.balance)})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`payments.${index}.amount`}
                                        render={({ field }) => (
                                            <FormItem className="w-32">
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        {...field}
                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    {fields.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => remove(index)}
                                            className="text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => append({ accountId: "", amount: Math.max(0, remaining) })}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Agregar cuenta de origen
                        </Button>

                        <div className="bg-muted p-3 rounded-md flex justify-between items-center text-sm">
                            <span className="font-medium text-muted-foreground">Restante por asignar:</span>
                            <span className={`font-bold ${Math.abs(remaining) <= 0.01 ? 'text-emerald-600' : 'text-orange-600'}`}>
                                {formatCurrency(remaining)}
                            </span>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPending}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isPending || Math.abs(remaining) > 0.01}>
                                {isPending ? "Procesando..." : "Confirmar Pago"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export const columns: ColumnDef<Payroll>[] = [
    {
        accessorKey: "employee",
        header: "Empleado",
        cell: ({ row }) => {
            const employee = row.original.employee;
            return (
                <div className="font-medium text-primary">
                    {employee.firstName} {employee.lastName}
                    {employee.taxId && <div className="text-xs text-muted-foreground break-words">{employee.taxId}</div>}
                </div>
            )
        }
    },
    {
        id: "period",
        header: "Periodo",
        cell: ({ row }) => {
            const startStr = row.original.periodStart;
            const endStr = row.original.periodEnd;
            const start = startStr ? format(new Date(startStr), "dd MMM yyyy", { locale: es }) : "N/A";
            const end = endStr ? format(new Date(endStr), "dd MMM yyyy", { locale: es }) : "N/A";
            return <div className="text-sm">{start} - {end}</div>;
        },
    },
    {
        accessorKey: "grossAmount",
        header: "Bruto",
        cell: ({ row }) => {
            return <div className="text-muted-foreground">{formatCurrency(row.getValue("grossAmount"))}</div>;
        },
    },
    {
        accessorKey: "deductions",
        header: "Deducciones",
        cell: ({ row }) => {
            return <div className="text-muted-foreground text-red-600">-{formatCurrency(row.getValue("deductions"))}</div>;
        },
    },
    {
        accessorKey: "netAmount",
        header: "Neto a Pagar",
        cell: ({ row }) => {
            return <div className="font-bold text-emerald-600">{formatCurrency(row.getValue("netAmount"))}</div>;
        },
    },
    {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <Badge className={getStatusColor(status)}>
                    {translateStatus(status)}
                </Badge>
            );
        },
    },
    {
        id: "actions",
        header: "Acciones",
        cell: ({ row, table }) => {
            const payroll = row.original;
            const meta = table.options.meta as { financialAccounts: any[] };
            const financialAccounts = meta?.financialAccounts || [];

            return <PayrollActionCell payroll={payroll} financialAccounts={financialAccounts} />
        },
    },
];

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    financialAccounts: any[];
}

export function PayrollTable<TData, TValue>({
    columns,
    data,
    financialAccounts,
}: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        meta: {
            financialAccounts
        }
    });

    const handleExportCSV = () => {
        const headers = ["Empleado", "Periodo Inicio", "Periodo Fin", "Bruto", "Deducciones", "Neto", "Estado"];
        const rows = (data as unknown as Payroll[]).map(p => [
            `${p.employee.firstName} ${p.employee.lastName}`,
            p.periodStart ? format(new Date(p.periodStart), "yyyy-MM-dd") : "",
            p.periodEnd ? format(new Date(p.periodEnd), "yyyy-MM-dd") : "",
            p.grossAmount,
            p.deductions,
            p.netAmount,
            translateStatus(p.status)
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `nominas_${format(new Date(), "yyyyMMdd")}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button variant="outline" onClick={handleExportCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                </Button>
            </div>
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No hay recibos de nómina registrados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Anterior
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Siguiente
                </Button>
            </div>
        </div>
    );
}
