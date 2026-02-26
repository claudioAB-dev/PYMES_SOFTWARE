import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const plans = [
    {
        name: "Profesional",
        price: "$1,500",
        period: "/mes",
        description: "Todo lo que tu PyME necesita para operar y crecer.",
        badge: "Más popular",
        highlighted: true,
        cta: "Comenzar Gratis",
        features: [
            "Hasta 3 empresas",
            "Hasta 15 usuarios",
            "Ventas y Facturación (CFDI 4.0)",
            "Compras y CxP",
            "Control de Inventario (Kardex)",
            "Tesorería y Flujo de Caja",
            "Roles y permisos granulares",
            "Soporte prioritario por chat",
            "Reportes ejecutivos",
            "Actualizaciones SAT incluidas",
        ],
        notIncluded: [
            "Nóminas y RR. HH.",
        ],
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "Para operaciones complejas con múltiples unidades de negocio.",
        badge: null,
        highlighted: false,
        cta: "Contactar Ventas",
        features: [
            "Empresas ilimitadas",
            "Usuarios ilimitados",
            "Todos los módulos incluidos",
            "Nóminas y RR. HH.",
            "Integraciones personalizadas (API)",
            "SLA 99.9% garantizado",
            "Gerente de cuenta dedicado",
            "Capacitación y onboarding",
        ],
        notIncluded: [],
    },
];

export function Pricing() {
    return (
        <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4">
                        Precios transparentes
                    </Badge>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                        Simple, sin sorpresas
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                        Elige el plan que mejor se adapta a tu etapa. Todos incluyen CFDI
                        4.0 y actualizaciones SAT automáticas.
                    </p>
                </div>

                {/* Plans grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-3xl mx-auto">
                    {plans.map((plan) => (
                        <Card
                            key={plan.name}
                            className={`relative flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${plan.highlighted
                                ? "border-primary shadow-2xl shadow-primary/10 scale-[1.02]"
                                : "border-border/60 hover:border-border hover:shadow-md"
                                }`}
                        >
                            {/* Top accent bar for highlighted plan */}
                            {plan.highlighted && (
                                <div className="h-1 w-full bg-gradient-to-r from-primary to-blue-600" />
                            )}

                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-base">{plan.name}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {plan.description}
                                        </p>
                                    </div>
                                    {plan.badge && (
                                        <Badge className="gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                                            <Sparkles className="h-3 w-3" />
                                            {plan.badge}
                                        </Badge>
                                    )}
                                </div>

                                <div className="mt-4 flex items-end gap-1">
                                    <span className="text-4xl font-extrabold">{plan.price}</span>
                                    <span className="text-muted-foreground mb-1 text-sm">
                                        {plan.period}
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1">
                                <ul className="space-y-2.5">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-start gap-2.5 text-sm">
                                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                    {plan.notIncluded.map((f) => (
                                        <li
                                            key={f}
                                            className="flex items-start gap-2.5 text-sm text-muted-foreground line-through"
                                        >
                                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 opacity-30" />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant={plan.highlighted ? "default" : "outline"}
                                    size="lg"
                                    asChild
                                >
                                    <Link href={plan.name === "Enterprise" ? "#contact" : "/login"}>
                                        {plan.cta}
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <p className="text-center text-sm text-muted-foreground mt-8">
                    Todos los planes incluyen 14 días de prueba gratuita. Sin tarjeta de crédito.
                </p>
            </div>
        </section>
    );
}
