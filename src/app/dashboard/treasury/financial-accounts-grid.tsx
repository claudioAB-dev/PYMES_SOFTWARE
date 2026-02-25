"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Landmark, Wallet, CreditCard, MoreHorizontal, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateFinancialAccount } from "./actions";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export function FinancialAccountsGrid({ accounts }: { accounts: any[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => (
                <AccountCard key={acc.id} account={acc} />
            ))}
            {accounts.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-8">
                    No hay cuentas financieras registradas.
                </div>
            )}
        </div>
    );
}

function AccountCard({ account }: { account: any }) {
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(account.name);

    const toggleStatus = () => {
        startTransition(async () => {
            const res = await updateFinancialAccount(account.id, { isActive: !account.isActive });
            if (res?.error) toast.error(res.error);
            else toast.success(`Cuenta ${account.isActive ? "desactivada" : "activada"}`);
        });
    };

    const saveName = () => {
        if (!editName.trim() || editName === account.name) {
            setIsEditing(false);
            return;
        }
        startTransition(async () => {
            const res = await updateFinancialAccount(account.id, { name: editName });
            if (res?.error) toast.error(res.error);
            else {
                toast.success("Nombre actualizado");
                setIsEditing(false);
            }
        });
    };

    const Icon = account.type === 'BANK' ? Landmark : account.type === 'CREDIT' ? CreditCard : Wallet;

    return (
        <Card className={`${!account.isActive ? 'opacity-60 bg-muted/50' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    {isEditing ? (
                        <div className="flex items-center space-x-2">
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-7 text-sm"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                            />
                            <Button size="sm" variant="ghost" onClick={saveName} disabled={isPending}>
                                Guardar
                            </Button>
                        </div>
                    ) : (
                        <CardTitle className="text-base font-semibold truncate max-w-[200px]" title={account.name}>
                            {account.name}
                        </CardTitle>
                    )}
                    <CardDescription className="flex items-center text-xs">
                        <Icon className="mr-1 h-3 w-3" />
                        {account.type === 'BANK' ? 'Banco' : account.type === 'CASH' ? 'Caja' : 'Crédito'} • {account.currency}
                    </CardDescription>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                            Editar Nombre
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={toggleStatus} disabled={isPending}>
                            {account.isActive ? (
                                <><XCircle className="mr-2 h-4 w-4" /> Desactivar</>
                            ) : (
                                <><CheckCircle2 className="mr-2 h-4 w-4" /> Activar</>
                            )}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold mt-2">
                    {formatCurrency(Number(account.balance))}
                </div>
                {!account.isActive && (
                    <Badge variant="secondary" className="mt-2 text-[10px]">Inactiva</Badge>
                )}
            </CardContent>
        </Card>
    );
}
