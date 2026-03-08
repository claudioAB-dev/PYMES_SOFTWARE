"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ShoppingCart,
    ShoppingBag,
    Settings,
    Package,
    Users,
    Landmark,
    ClipboardList,
    Factory,
    CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardSidebarProps {
    className?: string;
    userPermissions: string[];
}

export function DashboardSidebar({ className, userPermissions }: DashboardSidebarProps) {
    const pathname = usePathname();

    const coreRoutes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/dashboard",
            color: "text-sky-500",
            permissionId: "view:dashboard",
        },
        {
            label: "Directorio / PyMEs",
            icon: Users,
            href: "/dashboard/entities",
            color: "text-violet-500",
            permissionId: "view:entities",
        },
        {
            label: "Ventas / Cotizaciones",
            icon: ShoppingCart,
            href: "/dashboard/orders",
            color: "text-pink-700",
            permissionId: "view:orders",
        },
        {
            label: "Compras",
            icon: ShoppingBag,
            href: "/dashboard/purchases",
            color: "text-blue-600",
            permissionId: "view:purchases",
        },
        {
            label: "Tesorería",
            icon: Landmark,
            href: "/dashboard/treasury",
            color: "text-emerald-500",
            permissionId: "view:treasury",
        },
        {
            label: "Inventario",
            icon: Package,
            href: "/dashboard/products",
            color: "text-orange-700",
            permissionId: "view:products",
        },
        {
            label: "Recursos Humanos",
            icon: Users,
            href: "/dashboard/hr",
            color: "text-yellow-500",
            permissionId: "view:hr",
        },
        {
            label: "Nómina / Pagos",
            icon: Landmark,
            href: "/dashboard/payroll",
            color: "text-emerald-400",
            permissionId: "view:payroll",
        },
        {
            label: "Configuración",
            icon: Settings,
            href: "/dashboard/settings",
            color: "text-gray-500",
            permissionId: "view:settings",
        },
    ];

    const manufacturingRoutes = [
        {
            label: "Recetas (BOM)",
            icon: ClipboardList,
            href: "/dashboard/manufacturing/bom",
            color: "text-amber-500",
            permissionId: "view:manufacturing",
        },
        {
            label: "Órdenes de Producción",
            icon: Factory,
            href: "/dashboard/manufacturing/orders",
            color: "text-amber-600",
            permissionId: "view:manufacturing",
        },
        {
            label: "Materias Primas e Insumos",
            icon: Package,
            href: "/dashboard/manufacturing/raw-materials",
            color: "text-amber-700",
            permissionId: "view:manufacturing",
        },
        {
            label: "Planificador",
            icon: CalendarDays,
            href: "/dashboard/manufacturing/planner",
            color: "text-amber-400",
            permissionId: "view:manufacturing",
        },
    ];

    const filteredCoreRoutes = coreRoutes.filter(
        route => userPermissions.includes('*') || userPermissions.includes(route.permissionId)
    );

    const filteredManufacturingRoutes = manufacturingRoutes.filter(
        route => userPermissions.includes('*') || userPermissions.includes(route.permissionId)
    );

    return (
        <div className={cn("pb-12 space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white", className)} suppressHydrationWarning>
            <div className="px-3 py-2 flex-1" suppressHydrationWarning>
                <Link href="/dashboard" className="flex items-center pl-3 mb-14" suppressHydrationWarning>
                    <h1 className="text-2xl font-bold">
                        Pymes Soft
                    </h1>
                </Link>

                <Tabs defaultValue="core" className="w-full">
                    <TabsList className="w-full bg-slate-800/50 mb-4 h-11 p-1" suppressHydrationWarning>
                        <TabsTrigger
                            value="core"
                            className="w-full data-[state=active]:bg-slate-700 data-[state=active]:text-white text-zinc-400"
                        >
                            Axioma
                        </TabsTrigger>
                        <TabsTrigger
                            value="manufactura"
                            className="w-full data-[state=active]:bg-slate-700 data-[state=active]:text-amber-500 text-zinc-400"
                        >
                            Manufactura
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="core" className="space-y-1 mt-0" suppressHydrationWarning>
                        {filteredCoreRoutes.map((route) => {
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
                    </TabsContent>

                    <TabsContent value="manufactura" className="space-y-1 mt-0">
                        {filteredManufacturingRoutes.map((route) => {
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
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
