"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOutAction } from "@/app/(auth)/actions";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from "@/components/ui/sheet";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

interface DashboardHeaderProps {
    organizationName: string;
    userEmail?: string;
    userPermissions: string[];
    daysLeft?: number;
    subscriptionStatus?: string | null;
    isTrialExpired?: boolean;
}

export function DashboardHeader({ 
    organizationName, 
    userEmail, 
    userPermissions,
    daysLeft,
    subscriptionStatus,
    isTrialExpired
}: DashboardHeaderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const isTrial = subscriptionStatus === 'trialing';
    const isLowDays = (daysLeft ?? 0) <= 3;

    // Close sheet when pathname changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    return (
        <div className="h-16 border-b px-4 flex items-center justify-between bg-white w-full" suppressHydrationWarning>
            <div className="flex items-center gap-x-3">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger className="md:hidden pr-2 hover:opacity-75 transition">
                        <Menu className="h-6 w-6 text-slate-700" />
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 bg-slate-900 w-72 border-none">
                        <SheetTitle className="sr-only">Navegación</SheetTitle>
                        <DashboardSidebar userPermissions={userPermissions} />
                    </SheetContent>
                </Sheet>
                <div className="flex flex-col md:flex-row md:items-center gap-x-3">
                    <div className="font-semibold text-lg text-slate-800" suppressHydrationWarning>
                        {organizationName}
                    </div>
                    {isTrial && (
                        <Link href="/dashboard/billing">
                            <Badge 
                                variant={isLowDays ? "destructive" : "secondary"}
                                className={`flex items-center gap-x-1 cursor-pointer hover:opacity-80 transition py-1 px-3 ${
                                    !isLowDays && "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200"
                                }`}
                            >
                                <Zap className="h-3 w-3 fill-current" />
                                <span>
                                    Prueba gratuita: Quedan {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
                                </span>
                            </Badge>
                        </Link>
                    )}
                </div>
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
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/profile" className="cursor-pointer">
                                Perfil
                            </Link>
                        </DropdownMenuItem>
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
