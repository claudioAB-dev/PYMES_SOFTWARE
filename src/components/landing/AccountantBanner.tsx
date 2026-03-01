import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calculator, Briefcase, Users } from "lucide-react";

export function AccountantBanner() {
    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8 sm:p-12 lg:p-16">
                    {/* Background accents */}
                    <div className="absolute inset-0 -z-0">
                        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
                        <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
                    </div>

                    <div className="relative z-10 grid lg:grid-cols-5 gap-10 items-center">
                        {/* Left copy — 3 cols */}
                        <div className="lg:col-span-3 space-y-5">
                            <Badge className="bg-white/10 text-white border-white/15 hover:bg-white/15 gap-1.5 px-3 py-1.5">
                                <Calculator className="h-3 w-3 text-amber-400" />
                                <span>Para Contadores y Despachos</span>
                            </Badge>

                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                                ¿Eres contador?{" "}
                                <span className="bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
                                    Axioma fue hecho para ti.
                                </span>
                            </h2>

                            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                                Descarga masiva del SAT, bóveda fiscal inteligente y manejo
                                multicliente desde un solo panel. Recupera horas cada semana.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button
                                    size="lg"
                                    className="gap-2 px-7 text-base bg-white text-slate-900 hover:bg-slate-100"
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
                                    className="gap-2 px-7 text-base border border-white/20 text-white hover:bg-white/10 hover:text-white"
                                    asChild
                                >
                                    <Link href="/register?role=accountant">
                                        Comenzar gratis
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Right mini-stats — 2 cols */}
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
                                    className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-white/5 border border-white/10 text-center"
                                >
                                    <stat.icon className="h-5 w-5 text-sky-400" />
                                    <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                                    <p className="text-xs text-slate-400 leading-snug">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
