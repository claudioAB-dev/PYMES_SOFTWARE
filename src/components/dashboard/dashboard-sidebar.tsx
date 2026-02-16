"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    Settings,
    Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardSidebarProps {
    className?: string;
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
    const pathname = usePathname();

    const routes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/dashboard",
            color: "text-sky-500",
        },
        {
            label: "Clientes & Prov.",
            icon: Users,
            href: "/dashboard/entities",
            color: "text-violet-500",
        },
        {
            label: "Ventas",
            icon: ShoppingCart,
            href: "/dashboard/orders",
            color: "text-pink-700",
        },
        {
            label: "Productos",
            icon: Package,
            href: "/dashboard/products",
            color: "text-orange-700",
        },
        {
            label: "Configuración",
            icon: Settings,
            href: "/dashboard/settings",
            color: "text-gray-500",
        },
    ];

    return (
        <div className={cn("pb-12 space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white", className)}>
            <div className="px-3 py-2 flex-1">
                <Link href="/dashboard" className="flex items-center pl-3 mb-14">
                    <h1 className="text-2xl font-bold">
                        Pymes Soft
                    </h1>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => {
                        const isActive = route.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname.startsWith(route.href);

                        return (
                            <Button
                                key={route.href}
                                asChild
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start cursor-pointer",
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
        </div>
    );
}
