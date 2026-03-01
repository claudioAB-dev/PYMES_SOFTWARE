"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccountantSidebar() {
    const pathname = usePathname();

    const routes = [
        {
            label: "Panel Principal",
            icon: LayoutDashboard,
            href: "/accountant",
            color: "text-sky-500",
        },
        // We can add more options if needed
    ];

    return (
        <div className="pb-12 space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white" suppressHydrationWarning>
            <div className="px-3 py-2 flex-1" suppressHydrationWarning>
                <Link href="/accountant" className="flex items-center pl-3 mb-14">
                    <h1 className="text-2xl font-bold">
                        Axioma
                    </h1>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => {
                        const isActive = pathname === route.href;

                        return (
                            <Button
                                key={route.href}
                                asChild
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start cursor-pointer transition-colors",
                                    isActive ? "bg-white/10" : "text-zinc-400 hover:text-white hover:bg-white/10"
                                )}
                            >
                                <Link href={route.href}>
                                    <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                    {route.label}
                                </Link>
                            </Button>
                        );
                    })}
                </div>
            </div>
            {/* Branding corner */}
            <div className="p-4 opacity-50 px-6" suppressHydrationWarning>
                <p className="text-xs font-semibold text-white tracking-widest uppercase">Portal de Contadores</p>
                <p className="text-[10px] mt-1 text-slate-400">© 2026 Axioma ERP</p>
            </div>
        </div>
    );
}
