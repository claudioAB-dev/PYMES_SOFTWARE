"use client";

import Link from "next/link";
import { Check, X, Sparkles, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const plans = [
    {
        name: "Pro",
        price: "$899",
        period: "/mes",
        description: "Todo lo que tu PyME comercial necesita para operar y facturar sin rechazos.",
        badge: null,
        highlighted: false,
        cta: "Iniciar prueba gratuita",
        ctaHref: "/login",
        features: [
            { text: "Hasta 2 empresas", included: true },
            { text: "Hasta 10 usuarios", included: true },
            { text: "Ventas y Facturación CFDI 4.0", included: true },
            { text: "Compras y CxP", included: true },
            { text: "Control de Inventario (Kardex)", included: true },
            { text: "Tesorería y Flujo de Caja", included: true },
            { text: "RBAC granular", included: true },
            { text: "Motor de Precios B2B", included: true },
            { text: "Soporte por chat", included: true },
            { text: "BOM Dinámica con Factor de Merma", included: false },
            { text: "Órdenes de Producción", included: false },
            { text: "Costo Real por Lote", included: false },
        ],
    },
    {
        name: "Manufactura",
        price: "$1,499",
        period: "/mes",
        description: "Para empresas que fabrican. Control total del piso de producción.",
        badge: "Más popular",
        highlighted: true,
        cta: "Ver demo en vivo",
        ctaHref: "#contact",
        features: [
            { text: "Hasta 2 empresas", included: true },
            { text: "Hasta 15 usuarios", included: true },
            { text: "Ventas y Facturación CFDI 4.0", included: true },
            { text: "Compras y CxP", included: true },
            { text: "Control de Inventario (Kardex)", included: true },
            { text: "Tesorería y Flujo de Caja", included: true },
            { text: "RBAC granular", included: true },
            { text: "Motor de Precios B2B", included: true },
            { text: "BOM Dinámica con Factor de Merma", included: true },
            { text: "Órdenes de Producción Transaccionales", included: true },
            { text: "Calculadora de Costo Real por Lote", included: true },
            { text: "Soporte prioritario por chat", included: true },
            { text: "Nóminas y RR. HH.", included: false },
            { text: "API e Integraciones", included: false },
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
        ctaHref: "#contact",
        features: [
            { text: "Empresas ilimitadas", included: true },
            { text: "Usuarios ilimitados", included: true },
            { text: "Todos los módulos incluidos", included: true },
            { text: "Nóminas y RR. HH.", included: true },
            { text: "API e Integraciones personalizadas", included: true },
            { text: "SLA 99.9% garantizado", included: true },
            { text: "Gerente de cuenta dedicado", included: true },
            { text: "Capacitación y onboarding", included: true },
        ],
    },
];

export function Pricing() {
    const sectionRef = useScrollReveal<HTMLElement>();

    return (
        <section ref={sectionRef} id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-[--background]">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-accent] mb-3">
                        Precios transparentes
                    </p>
                    <h2 className="font-heading text-3xl sm:text-4xl tracking-[-0.02em] text-[--foreground]">
                        Simple, sin sorpresas
                    </h2>
                    <p className="mt-4 text-lg text-[--muted-foreground] max-w-xl mx-auto">
                        Elige el plan que mejor se adapta a tu operación. Todos incluyen
                        CFDI 4.0 y actualizaciones SAT automáticas.
                    </p>
                </div>

                {/* Plans grid */}
                <div className="scroll-reveal-stagger revealed grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`scroll-reveal-item relative flex flex-col overflow-hidden rounded-lg border bg-[--card] transition-all duration-300 ${plan.highlighted
                                    ? "border-[--primary] shadow-[0_0_0_1px_var(--primary),0_0_30px_rgba(37,99,235,0.2)] lg:scale-105"
                                    : "border-[--border] card-glow"
                                }`}
                        >
                            {/* Top accent */}
                            {plan.highlighted && (
                                <div className="h-1 w-full bg-gradient-to-r from-[--primary] to-[--color-accent]" />
                            )}

                            {/* Badge */}
                            {plan.badge && (
                                <div className="absolute top-4 right-4 z-10">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[--primary] text-white rounded">
                                        <Sparkles className="h-3 w-3" />
                                        {plan.badge}
                                    </span>
                                </div>
                            )}

                            <div className="p-6 pb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-sm text-[--foreground]">{plan.name}</p>
                                    {plan.name === "Manufactura" && (
                                        <Factory className="h-4 w-4 text-emerald-400" />
                                    )}
                                </div>
                                <p className="text-xs text-[--muted-foreground] mb-5">
                                    {plan.description}
                                </p>

                                <div className="flex items-end gap-1 mb-6">
                                    <span className="font-heading text-[48px] leading-none text-[--foreground]">{plan.price}</span>
                                    <span className="text-[--muted-foreground] mb-2 text-sm">
                                        {plan.period}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 px-6 pb-4">
                                <ul className="space-y-2.5">
                                    {plan.features.map((f) => (
                                        <li
                                            key={f.text}
                                            className={`flex items-start gap-2.5 text-sm ${f.included
                                                    ? "text-[--foreground]"
                                                    : "text-[--muted-foreground]/50 line-through opacity-50"
                                                }`}
                                        >
                                            {f.included ? (
                                                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                                            ) : (
                                                <X className="mt-0.5 h-4 w-4 flex-shrink-0 opacity-30" />
                                            )}
                                            <span>{f.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-6 pt-4">
                                <Button
                                    className={`w-full cta-hover ${plan.highlighted
                                            ? "bg-[--primary] hover:bg-[#1d4ed8] text-white"
                                            : "bg-transparent border border-[--border] text-[--foreground] hover:border-[--primary] hover:bg-[--primary]/10"
                                        }`}
                                    size="lg"
                                    asChild
                                >
                                    <Link href={plan.ctaHref}>
                                        {plan.cta}
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-center text-sm text-[--muted-foreground] mt-8">
                    Todos los planes incluyen 14 días de prueba gratuita · Sin tarjeta de crédito · Sin permanencia forzosa
                </p>
            </div>
        </section>
    );
}
