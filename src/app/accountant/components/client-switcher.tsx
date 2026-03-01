"use client";

import { useState, useTransition } from "react";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { setActiveOrganization } from "../actions";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface Organization {
    id: string;
    name: string;
}

interface ClientSwitcherProps {
    organizations: Organization[];
    activeOrgId: string;
}

export function ClientSwitcher({ organizations, activeOrgId }: ClientSwitcherProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const activeOrg = organizations.find((org) => org.id === activeOrgId);

    const handleOrgChange = (orgId: string) => {
        if (orgId === activeOrgId) {
            setOpen(false);
            return;
        }

        startTransition(async () => {
            try {
                await setActiveOrganization(orgId);
                toast.success("Empresa activa actualizada");
            } catch (error) {
                toast.error("Error al cambiar la empresa activa");
            } finally {
                setOpen(false);
            }
        });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-label="Seleccionar empresa"
                    className="w-[250px] justify-between bg-white border-slate-200"
                    disabled={isPending || organizations.length === 0}
                >
                    <Building2 className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">
                        {activeOrg ? activeOrg.name : "Seleccionar empresa..."}
                    </span>
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Buscar empresa..." />
                    <CommandList>
                        <CommandEmpty>No se encontraron empresas.</CommandEmpty>
                        <CommandGroup heading="Tus Clientes">
                            {organizations.map((org) => (
                                <CommandItem
                                    key={org.id}
                                    value={org.name} // CommandItem matches against value, and radix/cmdk normalizes it. So org.name is better.
                                    onSelect={() => handleOrgChange(org.id)}
                                    className="text-sm"
                                >
                                    {org.name}
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            activeOrgId === org.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
