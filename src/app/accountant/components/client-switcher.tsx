"use client";

import { useTransition } from "react";
import { Building2 } from "lucide-react";
import { setActiveOrganization } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Organization {
    id: string;
    name: string;
}

interface ClientSwitcherProps {
    organizations: Organization[];
    activeOrgId: string;
}

export function ClientSwitcher({ organizations, activeOrgId }: ClientSwitcherProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleOrgChange = (orgId: string) => {
        if (orgId === activeOrgId) return;

        startTransition(async () => {
            try {
                await setActiveOrganization(orgId);
                toast.success("Empresa activa actualizada");
                router.push(`/accountant/organizations/${orgId}`);
                router.refresh();
            } catch (error) {
                toast.error("Error al cambiar la empresa activa");
            }
        });
    };

    return (
        <Select
            value={activeOrgId}
            onValueChange={handleOrgChange}
            disabled={isPending || organizations.length === 0}
        >
            <SelectTrigger className="w-[250px] bg-white border-slate-200">
                <div className="flex items-center gap-2 pr-2">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Seleccionar empresa..." />
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>¿Qué PyME estás auditando?</SelectLabel>
                    {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id} className="text-sm">
                            {org.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
