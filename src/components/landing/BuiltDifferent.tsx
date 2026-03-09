"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";

/* ── Custom line-art SVG icons ── */
function VaultIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="6" y="8" width="36" height="32" rx="3" />
            <circle cx="24" cy="24" r="8" />
            <circle cx="24" cy="24" r="3" />
            <line x1="24" y1="16" x2="24" y2="13" />
            <line x1="24" y1="35" x2="24" y2="32" />
            <line x1="16" y1="24" x2="13" y2="24" />
            <line x1="35" y1="24" x2="32" y2="24" />
            <rect x="38" y="18" width="4" height="12" rx="1" />
        </svg>
    );
}

function MathEngineIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="8" y="6" width="32" height="36" rx="3" />
            <line x1="14" y1="14" x2="34" y2="14" />
            <line x1="14" y1="20" x2="28" y2="20" />
            <line x1="14" y1="26" x2="30" y2="26" />
            <text x="16" y="36" fontSize="8" fill="currentColor" stroke="none" fontFamily="monospace">6dec</text>
            <circle cx="36" cy="36" r="6" />
            <path d="M33 36h6M36 33v6" />
        </svg>
    );
}

function CostLotIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M8 38V16l8-8h16l8 8v22a2 2 0 01-2 2H10a2 2 0 01-2-2z" />
            <path d="M16 8v8h-8" />
            <line x1="16" y1="22" x2="32" y2="22" />
            <line x1="16" y1="28" x2="28" y2="28" />
            <line x1="16" y1="34" x2="24" y2="34" />
            <path d="M30 30l4 4 6-8" />
        </svg>
    );
}

const differentiators = [
    {
        icon: VaultIcon,
        title: "Bóveda CSD de Grado Militar",
        description:
            "Cifrado AES-256. Solo almacena el poder de timbrar, nunca tu e.firma. Tu CSD viaja cifrado, se usa una vez y se destruye en memoria.",
        accent: "text-[--color-accent]",
    },
    {
        icon: MathEngineIcon,
        title: "Motor Matemático CFDI 4.0",
        description:
            "Cálculo a 6 decimales por partida. Cero rechazos del PAC garantizados. Tu facturación cuadra al centavo, siempre.",
        accent: "text-[--primary]",
    },
    {
        icon: CostLotIcon,
        title: "Costo Real por Lote",
        description:
            "Absorbe merma, variaciones de materia prima y gastos indirectos. Tu margen real, no una estimación. Decide con datos, no con corazonadas.",
        accent: "text-emerald-400",
    },
];

export function BuiltDifferent() {
    const sectionRef = useScrollReveal<HTMLElement>();

    return (
        <section ref={sectionRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-[--background]">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="text-center mb-16 scroll-reveal revealed">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-accent] mb-3">
                        Diferenciación técnica
                    </p>
                    <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl tracking-[-0.02em] text-[--foreground]">
                        Construido{" "}
                        <span className="text-accent">diferente</span>
                    </h2>
                    <p className="mt-4 text-lg text-[--muted-foreground] max-w-2xl mx-auto">
                        No es otro ERP genérico con logo nuevo. Cada módulo está diseñado
                        con rigor matemático y seguridad criptográfica real.
                    </p>
                </div>

                {/* Asymmetric 3-column layout */}
                <div
                    className="scroll-reveal-stagger revealed grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
                >
                    {differentiators.map((item, index) => (
                        <div
                            key={item.title}
                            className={`scroll-reveal-item card-glow rounded-lg border border-[--border] bg-[--card] p-8 ${index === 1 ? "md:translate-y-[40px]" : ""
                                }`}
                        >
                            <item.icon
                                className={`h-12 w-12 ${item.accent} mb-6`}
                            />
                            <h3 className="font-heading text-xl text-[--foreground] mb-3">
                                {item.title}
                            </h3>
                            <p className="text-sm text-[--muted-foreground] leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
