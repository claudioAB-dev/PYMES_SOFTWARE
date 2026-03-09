"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Play,
    ArrowRight,
    ShieldCheck,
    Clock,
    CreditCard,
    CheckCircle2,
} from "lucide-react";
import { CountUp } from "@/components/landing/CountUp";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export function Hero() {
    const sectionRef = useScrollReveal<HTMLElement>();

    return (
        <section
            ref={sectionRef}
            className="mesh-gradient relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-24"
        >
            <div className="relative z-10 mx-auto max-w-7xl w-full py-20 md:py-28 lg:py-32">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left: Copy */}
                    <div className="flex flex-col items-start gap-6 scroll-reveal revealed">
                        {/* Badge row */}
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-[--border] bg-[--card] text-[--foreground]">
                                <ShieldCheck className="h-3 w-3 text-[--color-accent]" />
                                CFDI 4.0 · Cero rechazos
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-[--border] bg-[--card] text-[--foreground]">
                                🏭 Manufactura
                            </span>
                        </div>

                        <h1 className="font-heading text-4xl sm:text-5xl xl:text-[72px] xl:leading-[1.05] font-normal tracking-[-0.02em] text-[--foreground]">
                            Cero rechazos del SAT.{" "}
                            <span className="text-accent">El costo real de cada lote.</span>{" "}
                            El ERP que su contador hubiera querido que usaras.
                        </h1>

                        <p className="text-lg sm:text-xl text-[--muted-foreground] max-w-lg leading-relaxed">
                            Facturación criptográficamente segura y control exacto
                            de mermas de producción. Precisión matemática a 6
                            decimales para PyMEs que escalan sin perder el control.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
                            <Button size="lg" className="cta-hover gap-2 px-8 bg-[--primary] hover:bg-[#1d4ed8] text-white" asChild>
                                <Link href="#contact">
                                    <Play className="h-4 w-4" />
                                    Ver demo en vivo
                                </Link>
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="cta-hover gap-2 px-8 border-[--border] text-[--foreground] hover:bg-[--card] hover:border-[--primary]"
                                asChild
                            >
                                <Link href="/login">
                                    <ArrowRight className="h-4 w-4" />
                                    Iniciar prueba gratuita
                                </Link>
                            </Button>
                        </div>

                        {/* Verifiable trust signals */}
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2 text-sm text-[--muted-foreground]">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[--color-accent]" />
                                <span>14 días gratis</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-[--color-accent]" />
                                <span>Sin tarjeta</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-[--color-accent]" />
                                <span>&lt; 1 día para implementar</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Dashboard Mockup with 3D perspective */}
                    <div className="relative dashboard-glow">
                        <div className="perspective-dashboard rounded-lg border border-[--border] bg-[--card] shadow-2xl overflow-hidden">
                            {/* Browser chrome */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-[--border] bg-[#0d1321]">
                                <div className="h-2.5 w-2.5 rounded-full bg-[#ef4444]/60" />
                                <div className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]/60" />
                                <div className="h-2.5 w-2.5 rounded-full bg-[#22c55e]/60" />
                                <div className="mx-auto h-5 w-48 rounded-full bg-[--border] text-xs flex items-center justify-center text-[--muted-foreground]">
                                    app.axioma.mx/dashboard
                                </div>
                            </div>

                            {/* Dashboard content */}
                            <div className="p-5 space-y-4 bg-[--card]">
                                {/* KPI row with count-up */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="rounded-lg border border-[--border] bg-[#0d1321] p-3 space-y-1">
                                        <p className="text-[10px] uppercase tracking-wider text-[--muted-foreground]">Ventas del mes</p>
                                        <p className="text-sm font-bold text-[--foreground]">
                                            <CountUp prefix="$" target={248000} suffix="" className="tabular-nums" />
                                        </p>
                                        <span className="text-xs font-medium text-emerald-400">+12%</span>
                                    </div>
                                    <div className="rounded-lg border border-[--border] bg-[#0d1321] p-3 space-y-1">
                                        <p className="text-[10px] uppercase tracking-wider text-[--muted-foreground]">Producción</p>
                                        <p className="text-sm font-bold text-[--foreground]">
                                            <CountUp target={18} suffix=" órdenes" />
                                        </p>
                                        <span className="text-xs font-medium text-emerald-400">+5</span>
                                    </div>
                                    <div className="rounded-lg border border-[--border] bg-[#0d1321] p-3 space-y-1">
                                        <p className="text-[10px] uppercase tracking-wider text-[--muted-foreground]">Merma</p>
                                        <p className="text-sm font-bold text-[--foreground]">
                                            <CountUp target={2.3} decimals={1} suffix="%" />
                                        </p>
                                        <span className="text-xs font-medium text-emerald-400">-0.4%</span>
                                    </div>
                                </div>

                                {/* Chart */}
                                <div className="rounded-lg border border-[--border] bg-[#0d1321] p-4 space-y-2">
                                    <p className="text-[10px] uppercase tracking-wider font-semibold text-[--muted-foreground]">
                                        Tendencia de ventas
                                    </p>
                                    <div className="flex items-end gap-1.5 h-20">
                                        {[40, 65, 45, 80, 60, 90, 75, 95, 70, 88, 100, 85].map(
                                            (h, i) => (
                                                <div
                                                    key={i}
                                                    className="flex-1 rounded-sm bg-[--primary]/30 hover:bg-[--primary]/60 transition-colors"
                                                    style={{ height: `${h}%` }}
                                                />
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* Table rows */}
                                <div className="rounded-lg border border-[--border] bg-[#0d1321] divide-y divide-[--border] overflow-hidden">
                                    {[
                                        "Orden #1042 · Grupo Refresquero del Norte",
                                        "Orden #1041 · Distribuidora Familia Pérez",
                                        "Orden #1040 · Muebles y Diseño Monterrey",
                                    ].map((row) => (
                                        <div
                                            key={row}
                                            className="flex items-center justify-between px-3 py-2"
                                        >
                                            <p className="text-xs text-[--muted-foreground]">{row}</p>
                                            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 rounded-full px-2 py-0.5">
                                                Activo
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
