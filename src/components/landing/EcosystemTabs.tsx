"use client";

import {
    ShieldCheck,
    Calculator,
    Users,
    Layers,
    Boxes,
    Factory,
    Briefcase,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const axiomaPro = [
    {
        icon: ShieldCheck,
        title: "Bóveda CSD Segura",
        description:
            "Facturación SAT CFDI 4.0 sin exponer tu e.firma. Cifrado AES-256 de grado militar.",
        badge: "CFDI 4.0",
    },
    {
        icon: Calculator,
        title: "Motor Matemático Estricto",
        description:
            "Cero rechazos del PAC. Cálculos de impuestos exactos a 6 decimales.",
        badge: "Precisión",
    },
    {
        icon: Users,
        title: "Precios B2B y Roles",
        description:
            "Control de acceso granular (RBAC) y listas de precios dinámicas para tus clientes.",
        badge: "RBAC",
    },
];

const axiomaManufactura = [
    {
        icon: Layers,
        title: "BOM Dinámicas",
        description:
            "Estructuras recursivas con insumos, sub-ensambles y factores de merma automáticos.",
        badge: "BOM",
    },
    {
        icon: Boxes,
        title: "Inventario Vivo",
        description:
            "Órdenes de producción transaccionales. Congela, transforma y crea sin inventarios fantasma.",
        badge: "Transaccional",
    },
    {
        icon: Calculator,
        title: "Costo Real por Lote",
        description:
            "Prorratea insumos, mermas y tiempos. Tu margen verdadero, no una estimación.",
        badge: "Costeo",
    },
];

interface FeatureCardProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    badge: string;
}

function FeatureCard({ icon: Icon, title, description, badge }: FeatureCardProps) {
    return (
        <div className="card-glow rounded-lg border border-[--border] bg-[--card] p-6 space-y-4">
            <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-lg bg-[--primary]/10">
                    <Icon className="h-5 w-5 text-[--color-accent]" />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[--muted-foreground] bg-[--border] px-2 py-1 rounded">
                    {badge}
                </span>
            </div>
            <h3 className="font-heading text-base text-[--foreground]">{title}</h3>
            <p className="text-sm text-[--muted-foreground] leading-relaxed">
                {description}
            </p>
        </div>
    );
}

export function EcosystemTabs() {
    const sectionRef = useScrollReveal<HTMLElement>();

    return (
        <section
            ref={sectionRef}
            id="soluciones"
            className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0d1321]"
        >
            <div className="mx-auto max-w-7xl">
                <div className="text-center mb-12 scroll-reveal revealed">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-accent] mb-3">
                        Arquitectura Dual
                    </p>
                    <h2 className="font-heading text-3xl sm:text-4xl tracking-[-0.02em] text-[--foreground]">
                        Un ecosistema, <span className="text-[--muted-foreground]">dos potencias</span>
                    </h2>
                    <p className="mt-4 text-lg text-[--muted-foreground] max-w-2xl mx-auto">
                        Elige el módulo que necesitas hoy. Escala al siguiente cuando tu
                        negocio lo pida.
                    </p>
                </div>

                <Tabs defaultValue="pro" className="w-full items-center">
                    <TabsList className="mx-auto mb-10 h-11 bg-[--border] border border-[--border]">
                        <TabsTrigger value="pro" className="gap-2 px-6 py-2 data-[state=active]:bg-[--primary] data-[state=active]:text-white">
                            <Briefcase className="h-4 w-4" />
                            Axioma Pro
                        </TabsTrigger>
                        <TabsTrigger value="manufactura" className="gap-2 px-6 py-2 data-[state=active]:bg-[--primary] data-[state=active]:text-white">
                            <Factory className="h-4 w-4" />
                            Axioma Manufactura
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pro">
                        <div className="text-center mb-8">
                            <p className="text-xs font-semibold text-[--muted-foreground] uppercase tracking-wider">
                                Para Comercio y Servicios
                            </p>
                        </div>
                        <div className="scroll-reveal-stagger revealed grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {axiomaPro.map((feature) => (
                                <div key={feature.title} className="scroll-reveal-item">
                                    <FeatureCard {...feature} />
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="manufactura">
                        <div className="text-center mb-8">
                            <p className="text-xs font-semibold text-[--muted-foreground] uppercase tracking-wider">
                                Para la Industria
                            </p>
                        </div>
                        <div className="scroll-reveal-stagger revealed grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {axiomaManufactura.map((feature) => (
                                <div key={feature.title} className="scroll-reveal-item">
                                    <FeatureCard {...feature} />
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    );
}
