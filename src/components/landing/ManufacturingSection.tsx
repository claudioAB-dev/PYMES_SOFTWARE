"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

/* ── Custom SVG line-art icons (stroke, no fill) ── */
function BomTreeIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {/* Root node */}
            <circle cx="24" cy="6" r="4" />
            {/* Branch lines */}
            <line x1="24" y1="10" x2="24" y2="16" />
            <line x1="24" y1="16" x2="10" y2="22" />
            <line x1="24" y1="16" x2="24" y2="22" />
            <line x1="24" y1="16" x2="38" y2="22" />
            {/* Child nodes */}
            <circle cx="10" cy="26" r="4" />
            <circle cx="24" cy="26" r="4" />
            <circle cx="38" cy="26" r="4" />
            {/* Sub-branches from left node */}
            <line x1="10" y1="30" x2="6" y2="36" />
            <line x1="10" y1="30" x2="14" y2="36" />
            {/* Leaf nodes */}
            <circle cx="6" cy="40" r="3" />
            <circle cx="14" cy="40" r="3" />
        </svg>
    );
}

function ProcessFlowIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {/* Top box: MP */}
            <rect x="14" y="4" width="20" height="10" rx="2" />
            <text x="24" y="11" fontSize="6" fill="currentColor" stroke="none" textAnchor="middle" fontFamily="monospace">MP</text>
            {/* Arrow down */}
            <line x1="24" y1="14" x2="24" y2="20" />
            <polyline points="21,17 24,20 27,17" />
            {/* Middle box: WIP */}
            <rect x="14" y="20" width="20" height="10" rx="2" />
            <text x="24" y="27" fontSize="6" fill="currentColor" stroke="none" textAnchor="middle" fontFamily="monospace">WIP</text>
            {/* Arrow down */}
            <line x1="24" y1="30" x2="24" y2="36" />
            <polyline points="21,33 24,36 27,33" />
            {/* Bottom box: PT */}
            <rect x="14" y="36" width="20" height="10" rx="2" />
            <text x="24" y="43" fontSize="6" fill="currentColor" stroke="none" textAnchor="middle" fontFamily="monospace">PT</text>
            {/* Cycle arrow on the right */}
            <path d="M38 25 Q 42 15, 38 10" />
            <polyline points="36,11 38,10 40,12" />
        </svg>
    );
}

function PrecisionCalcIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {/* Calculator body */}
            <rect x="10" y="4" width="28" height="40" rx="3" />
            {/* Screen */}
            <rect x="14" y="8" width="20" height="10" rx="1.5" />
            {/* Precision numbers on screen */}
            <text x="24" y="15" fontSize="5" fill="currentColor" stroke="none" textAnchor="middle" fontFamily="monospace">$42.37</text>
            {/* Grid of buttons */}
            <rect x="14" y="22" width="5" height="4" rx="0.5" />
            <rect x="21.5" y="22" width="5" height="4" rx="0.5" />
            <rect x="29" y="22" width="5" height="4" rx="0.5" />
            <rect x="14" y="28" width="5" height="4" rx="0.5" />
            <rect x="21.5" y="28" width="5" height="4" rx="0.5" />
            <rect x="29" y="28" width="5" height="4" rx="0.5" />
            <rect x="14" y="34" width="5" height="4" rx="0.5" />
            <rect x="21.5" y="34" width="5" height="4" rx="0.5" />
            <rect x="29" y="34" width="5" height="4" rx="0.5" />
            {/* Checkmark overlay */}
            <path d="M32 38l4 4 8-10" strokeWidth="2" />
        </svg>
    );
}

const features = [
    {
        icon: BomTreeIcon,
        title: "Lista de Materiales Dinámica",
        description:
            "Define estructuras de ingeniería con sub-ensambles y múltiples niveles. Incluye un Factor de Merma estadístico por insumo: el sistema calcula exactamente cuánto material comprar para absorber el desperdicio natural de tu operación.",
    },
    {
        icon: ProcessFlowIcon,
        title: "Órdenes de Producción Transaccionales",
        description:
            "Al iniciar una orden, la materia prima se congela en almacén en estado Work in Progress. Al cerrar la producción, los insumos se consumen y el producto terminado se crea automáticamente. Cero rupturas de stock. Cero inventarios fantasma.",
    },
    {
        icon: PrecisionCalcIcon,
        title: "Costo Real por Lote — Tu Ventaja Competitiva",
        description:
            "No es una estimación. Es el costo exacto: materia prima al precio real del día, merma real del turno contabilizada, gastos indirectos prorrateados. Sabes si ganaste o perdiste en cada lote antes de cerrar el turno.",
    },
];

export function ManufacturingSection() {
    const sectionRef = useScrollReveal<HTMLElement>();

    return (
        <section ref={sectionRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0d1321] relative overflow-hidden">
            {/* Subtle background orbs */}
            <div className="absolute inset-0 -z-0 pointer-events-none">
                <div className="absolute top-20 right-1/4 h-72 w-72 rounded-full bg-emerald-500/5 blur-3xl" />
                <div className="absolute bottom-20 left-1/3 h-56 w-56 rounded-full bg-[--primary]/5 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-emerald-500/30 text-emerald-400 mb-5">
                        🏭 Axioma Manufactura
                    </span>

                    <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl tracking-[-0.02em] text-[--foreground] leading-tight max-w-3xl mx-auto">
                        Deja de adivinar cuánto te cuesta{" "}
                        <span className="text-emerald-400">producir.</span>
                    </h2>

                    <p className="mt-5 text-lg text-[--muted-foreground] max-w-2xl mx-auto leading-relaxed">
                        El único ERP que absorbe la merma real, las variaciones de materia
                        prima y los gastos indirectos — y te entrega el margen neto de
                        cada lote sin estimaciones.
                    </p>
                </div>

                {/* Feature blocks — 3 cols desktop, 1 col mobile with dividers */}
                <div className="scroll-reveal-stagger revealed grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-8 mb-16">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            className={`scroll-reveal-item card-glow rounded-lg border border-[--border] bg-[--card] p-8 ${index > 0 ? "mt-4 lg:mt-0" : ""
                                }`}
                        >
                            <feature.icon className="h-12 w-12 text-[--color-accent] mb-6" />
                            <h3 className="font-heading text-lg text-[--foreground] mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-[--muted-foreground] leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Closing CTA block */}
                <div className="rounded-lg border border-[--border] bg-[--card] p-8 sm:p-10 lg:p-12">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                        <div className="max-w-xl">
                            <h3 className="font-heading text-xl sm:text-2xl text-[--foreground] mb-2">
                                ¿Fabricas agua, muebles, alimentos o cualquier producto con materia prima?
                            </h3>
                            <p className="text-sm text-[--muted-foreground] leading-relaxed">
                                Axioma Manufactura fue construido para tu operación. No es un
                                módulo agregado — es un motor de producción nativo integrado
                                al núcleo del sistema.
                            </p>
                        </div>

                        <div className="flex flex-col items-center lg:items-end gap-2 shrink-0">
                            <Button
                                size="lg"
                                className="cta-hover gap-2 px-8 bg-[--primary] hover:bg-[#1d4ed8] text-white w-full lg:w-auto"
                                asChild
                            >
                                <Link href="#contact">
                                    <Play className="h-4 w-4" />
                                    Ver demo de manufactura
                                </Link>
                            </Button>
                            <p className="text-xs text-[--muted-foreground]">
                                Demo personalizada · 30 minutos · Sin compromiso
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
