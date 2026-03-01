"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOutAction } from "@/app/(auth)/actions";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AccountantSidebar } from "./accountant-sidebar";
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

import { ClientSwitcher } from "./client-switcher";

interface AccountantHeaderProps {
    userEmail?: string;
    userName?: string;
    organizations?: { id: string; name: string }[];
    activeOrgId?: string;
}

export function AccountantHeader({ userEmail, userName, organizations = [], activeOrgId = "" }: AccountantHeaderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    return (
        <div className="h-16 border-b px-6 flex items-center justify-between bg-white w-full sticky top-0 z-50 shadow-sm" suppressHydrationWarning>
            <div className="flex items-center gap-x-3">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger className="md:hidden pr-2 hover:opacity-75 transition">
                        <Menu className="h-6 w-6 text-slate-700" />
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 bg-slate-900 w-72 border-none">
                        <SheetTitle className="sr-only">Navegación</SheetTitle>
                        <AccountantSidebar />
                    </SheetContent>
                </Sheet>
                <div className="font-semibold text-lg text-slate-800 hidden md:block" suppressHydrationWarning>
                    Panel Principal - {userName}
                </div>
            </div>

            <div className="hidden md:flex flex-1 items-center justify-center px-6">
                {organizations.length > 0 && activeOrgId && (
                    <ClientSwitcher organizations={organizations} activeOrgId={activeOrgId} />
                )}
            </div>

            <div className="flex items-center gap-x-4" suppressHydrationWarning>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="cursor-pointer border-2 border-indigo-100 hover:border-indigo-200 transition-colors">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-indigo-50 text-indigo-700 font-medium">
                                {userEmail?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{userName}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {userEmail}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => signOutAction()}
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                        >
                            Cerrar Sesión
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
