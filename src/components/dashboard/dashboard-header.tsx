"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOutAction } from "@/app/login/actions";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
    organizationName: string;
    userEmail?: string;
}

export function DashboardHeader({ organizationName, userEmail }: DashboardHeaderProps) {
    return (
        <div className="h-16 border-b px-4 flex items-center justify-between bg-white w-full" suppressHydrationWarning>
            <div className="font-semibold text-lg text-slate-800" suppressHydrationWarning>
                {organizationName}
            </div>

            <div className="flex items-center gap-x-4" suppressHydrationWarning>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="cursor-pointer">
                            <AvatarImage src="" />
                            <AvatarFallback>{userEmail?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Perfil</DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => signOutAction()}
                            className="text-destructive focus:text-destructive cursor-pointer"
                        >
                            Cerrar Sesión
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
