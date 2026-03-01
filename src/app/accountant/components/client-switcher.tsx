"use client";

import { useTransition } from "react";
import { Building2 } from "lucide-react";
import { setActiveOrganization } from "../actions";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    const [isPending, startTransition] = useTransition();

    const handleOrgChange = (orgId: string) => {
        startTransition(async () => {
            try {
                await setActiveOrganization(orgId);
                toast.success("Empresa activa actualizada");
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
            <SelectTrigger className="w-[280px] bg-white border-slate-200">
                <div className="flex items-center gap-x-2">
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Seleccionar empresa" />
                </div>
            </SelectTrigger>
            <SelectContent>
                {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                        {org.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
