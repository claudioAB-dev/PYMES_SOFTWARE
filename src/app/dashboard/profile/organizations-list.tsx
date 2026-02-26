"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Shield } from "lucide-react"

type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'ACCOUNTANT'

interface Membership {
    id: string
    role: Role
    organization: {
        id: string
        name: string
        slug: string
        logoUrl: string | null
    }
}

interface OrganizationsListProps {
    memberships: Membership[]
}

const roleColors: Record<Role, string> = {
    OWNER: "bg-purple-500 hover:bg-purple-600",
    ADMIN: "bg-blue-500 hover:bg-blue-600",
    MEMBER: "bg-gray-500 hover:bg-gray-600",
    ACCOUNTANT: "bg-green-500 hover:bg-green-600",
}

const roleLabels: Record<Role, string> = {
    OWNER: "Propietario",
    ADMIN: "Administrador",
    MEMBER: "Miembro",
    ACCOUNTANT: "Contador",
}

export function OrganizationsList({ memberships }: OrganizationsListProps) {
    if (!memberships || memberships.length === 0) {
        return (
            <div className="text-center py-10 bg-muted/20 border border-dashed rounded-lg">
                <Building2 className="mx-auto h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                <p className="text-sm text-muted-foreground">
                    No perteneces a ninguna organización aún.
                </p>
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {memberships.map((membership) => (
                <Card key={membership.id} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-4 pb-4">
                        <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center shrink-0 border">
                            {membership.organization.logoUrl ? (
                                <img
                                    src={membership.organization.logoUrl}
                                    alt={membership.organization.name}
                                    className="h-full w-full object-cover rounded-md"
                                />
                            ) : (
                                <Building2 className="h-6 w-6 text-primary" />
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden space-y-1">
                            <CardTitle className="truncate text-base">
                                {membership.organization.name}
                            </CardTitle>
                            <CardDescription className="truncate text-xs">
                                {membership.organization.slug}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="bg-muted/10 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Shield className="h-4 w-4 mr-2" />
                                Nivel de acceso
                            </div>
                            <Badge className={`${roleColors[membership.role]} text-white border-0`}>
                                {roleLabels[membership.role]}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
