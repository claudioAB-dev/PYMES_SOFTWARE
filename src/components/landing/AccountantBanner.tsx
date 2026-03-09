import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calculator, Briefcase, Users } from "lucide-react";

export function AccountantBanner() {
    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#0d1a2f] via-[#111827] to-[#0d1a2f] border border-[--border] p-8 sm:p-12 lg:p-16">
                    {/* Background accents */}
                    <div className="absolute inset-0 -z-0">
                        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-[--color-accent]/8 blur-3xl" />
                        <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-[--primary]/8 blur-3xl" />
                    </div>

                    <div className="relative z-10 grid lg:grid-cols-5 gap-10 items-center">
                        {/* Left copy */}
                        <div className="lg:col-span-3 space-y-5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-[--color-accent]/20 text-[--color-accent]">
                                <Calculator className="h-3 w-3" />
                                Para Contadores y Despachos
                            </span>

                            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl tracking-[-0.02em] text-[--foreground] leading-tight">
                                ¿Eres contador?{" "}
                                <span className="text-accent">
                                    Axioma fue hecho para ti.
                                </span>
                            </h2>

                            <p className="text-base sm:text-lg text-[--muted-foreground] leading-relaxed max-w-xl">
                                Descarga masiva del SAT, bóveda fiscal inteligente y manejo
                                multicliente desde un solo panel. Recupera horas cada semana.
                            </p>

                            <p className="text-sm text-[--color-accent]/80 leading-relaxed max-w-xl border-l-2 border-[--color-accent]/30 pl-4">
                                💰 ¿Llevas más de 2 empresas cliente? Pregunta por nuestro
                                programa de contadores aliados con comisión mensual recurrente.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button
                                    size="lg"
                                    className="cta-hover gap-2 px-7 bg-white text-[#0A0F1E] hover:bg-white/90 font-semibold"
                                    asChild
                                >
                                    <Link href="/contadores">
                                        Descubrir más
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button
                                    size="lg"
                                    variant="ghost"
                                    className="cta-hover gap-2 px-7 border border-white/20 text-[--foreground] hover:bg-white/10 hover:text-white"
                                    asChild
                                >
                                    <Link href="/register?role=accountant">
                                        Comenzar gratis
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Right mini-stats */}
                        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                            {[
                                {
                                    icon: Users,
                                    value: "50+",
                                    label: "Empresas desde un panel",
                                },
                                {
                                    icon: Briefcase,
                                    value: "10s",
                                    label: "Para abrir tu despacho",
                                },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className="flex flex-col items-center gap-2 p-5 rounded-lg bg-white/5 border border-white/10 text-center"
                                >
                                    <stat.icon className="h-5 w-5 text-[--color-accent]" />
                                    <p className="font-heading text-2xl text-[--foreground]">{stat.value}</p>
                                    <p className="text-xs text-[--muted-foreground] leading-snug">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
