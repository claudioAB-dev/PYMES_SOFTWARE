"use client";

import { Cloud, Database, Lock } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const badges = [
    {
        icon: Cloud,
        title: "Arquitectura Cloud Nativa",
        description: "Escalabilidad automática y disponibilidad 99.9%.",
    },
    {
        icon: Database,
        title: "PostgreSQL Transaccional",
        description: "Motor de alta integridad con backups cifrados cada 6 horas.",
    },
    {
        icon: Lock,
        title: "Cifrado Extremo a Extremo",
        description: "Tus datos protegidos en tránsito y en reposo con AES-256.",
    },
];

export function TrustBadges() {
    const sectionRef = useScrollReveal<HTMLElement>();

    return (
        <section
            ref={sectionRef}
            id="seguridad"
            className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0d1321] border-y border-[--border]"
        >
            <div className="mx-auto max-w-7xl">
                <div className="text-center mb-10">
                    <p className="text-xs font-semibold text-[--muted-foreground] uppercase tracking-[0.2em] mb-2">
                        Infraestructura y Seguridad
                    </p>
                    <h2 className="font-heading text-2xl sm:text-3xl tracking-[-0.02em] text-[--foreground]">
                        Construido sobre bases{" "}
                        <span className="text-[--muted-foreground]">sólidas</span>
                    </h2>
                </div>

                <div className="scroll-reveal-stagger revealed grid grid-cols-1 md:grid-cols-3 gap-8">
                    {badges.map((badge) => (
                        <div
                            key={badge.title}
                            className="scroll-reveal-item flex flex-col items-center text-center gap-3 group"
                        >
                            <div className="p-3.5 rounded-lg bg-[--primary]/10 group-hover:bg-[--primary]/20 transition-colors duration-300">
                                <badge.icon className="h-6 w-6 text-[--color-accent]" />
                            </div>
                            <h3 className="font-semibold text-sm text-[--foreground]">{badge.title}</h3>
                            <p className="text-sm text-[--muted-foreground] max-w-xs leading-relaxed">
                                {badge.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
