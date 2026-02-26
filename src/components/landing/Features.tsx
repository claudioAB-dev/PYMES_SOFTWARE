import {
    FileText,
    ShoppingCart,
    Package,
    Landmark,
    Users,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const modules = [
    {
        icon: FileText,
        title: "Ventas y Facturación",
        subtitle: "CFDI 4.0",
        description:
            "Genera facturas electrónicas, gestiona clientes, aplica descuentos y controla cuentas por cobrar en tiempo real.",
        color: "text-blue-500",
        bg: "bg-blue-50 dark:bg-blue-950/30",
        badge: "CFDI 4.0",
    },
    {
        icon: ShoppingCart,
        title: "Compras y CxP",
        subtitle: "Proveedores",
        description:
            "Administra órdenes de compra, valida facturas de proveedores y lleva el control puntual de tus cuentas por pagar.",
        color: "text-violet-500",
        bg: "bg-violet-50 dark:bg-violet-950/30",
        badge: "Nuevo",
    },
    {
        icon: Package,
        title: "Control de Inventario",
        subtitle: "Kardex",
        description:
            "Registro inmutable de cada movimiento de inventario con Kardex automatizado, lotes y control de múltiples almacenes.",
        color: "text-amber-500",
        bg: "bg-amber-50 dark:bg-amber-950/30",
        badge: "Kardex",
    },
    {
        icon: Landmark,
        title: "Tesorería y Flujo de Caja",
        subtitle: "Finanzas",
        description:
            "Visualiza el flujo de efectivo, concilia tus cuentas bancarias y anticipa necesidades de liquidez con reportes inteligentes.",
        color: "text-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        badge: "Pro",
    },
    {
        icon: Users,
        title: "Nóminas y RR. HH.",
        subtitle: "Capital Humano",
        description:
            "Calcula nóminas con IMSS, ISR y prestaciones de ley. Gestiona altas, bajas, vacaciones y organigrama de tu empresa.",
        color: "text-rose-500",
        bg: "bg-rose-50 dark:bg-rose-950/30",
        badge: "Enterprise",
    },
];

export function Features() {
    return (
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                {/* Section header */}
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4">
                        Módulos del sistema
                    </Badge>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        Todo lo que tu negocio necesita,{" "}
                        <span className="text-muted-foreground">en un solo lugar</span>
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Activa solo los módulos que usas hoy. Escala cuando estés listo.
                        Sin contratos largos.
                    </p>
                </div>

                {/* Modules grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((mod, index) => (
                        <Card
                            key={mod.title}
                            className="group relative overflow-hidden border-border/60 hover:border-border hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                            style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
                        >
                            {/* Top gradient bar */}
                            <div className={`h-1 w-full ${mod.bg.replace("bg-", "bg-gradient-to-r from-").split(" ")[0]} opacity-60 group-hover:opacity-100 transition-opacity`} />

                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className={`p-2.5 rounded-xl ${mod.bg}`}>
                                        <mod.icon className={`h-5 w-5 ${mod.color}`} />
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {mod.badge}
                                    </Badge>
                                </div>
                                <div className="mt-3">
                                    <h3 className="font-semibold text-base">{mod.title}</h3>
                                    <p className="text-xs text-muted-foreground">{mod.subtitle}</p>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {mod.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Teaser card for more modules */}
                    <Card className="border-dashed border-2 border-border/40 flex flex-col items-center justify-center p-8 text-center gap-3 hover:border-border/70 transition-colors cursor-pointer">
                        <div className="p-3 rounded-xl bg-muted">
                            <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="font-medium text-sm">Más módulos próximamente</p>
                        <p className="text-xs text-muted-foreground">
                            Contabilidad, CRM, Punto de Venta, y más.
                        </p>
                    </Card>
                </div>
            </div>
        </section>
    );
}
