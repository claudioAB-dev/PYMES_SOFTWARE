import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, TrendingUp, ShieldCheck, Zap } from "lucide-react";

export function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-16">
            {/* Background gradient blobs */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-blue-500/5 blur-3xl" />
                <div className="absolute top-1/3 right-0 h-64 w-64 rounded-full bg-violet-500/5 blur-3xl" />
            </div>

            <div className="mx-auto max-w-7xl w-full py-20 md:py-28 lg:py-32">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left: Copy */}
                    <div className="flex flex-col items-start gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                            <Zap className="h-3 w-3 text-amber-500" />
                            <span>Nuevo: CFDI 4.0 integrado</span>
                        </Badge>

                        <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight text-foreground">
                            El ERP que se adapta a tu{" "}
                            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                                PyME
                            </span>
                            , no al revés.
                        </h1>

                        <p className="text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed">
                            Gestiona ventas, compras, inventario, tesorería y nómina en una
                            plataforma modular, rápida y en la nube. Diseñado para México y
                            Latinoamérica.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
                            <Button size="lg" className="gap-2 px-8" asChild>
                                <Link href="/login">
                                    Empieza ahora
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="gap-2 px-8" asChild>
                                <Link href="#features">
                                    <Play className="h-4 w-4" />
                                    Ver demostración
                                </Link>
                            </Button>
                        </div>

                        {/* Social proof micro-stats */}
                        <div className="flex flex-wrap items-center gap-6 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <span>+1,200 empresas activas</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-blue-500" />
                                <span>SAT certificado</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Dashboard Mockup */}
                    <div className="relative animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                        <div className="relative rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden">
                            {/* Fake browser chrome */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-muted/30">
                                <div className="h-3 w-3 rounded-full bg-red-400" />
                                <div className="h-3 w-3 rounded-full bg-amber-400" />
                                <div className="h-3 w-3 rounded-full bg-green-400" />
                                <div className="mx-auto h-5 w-48 rounded-full bg-muted/60 text-xs flex items-center justify-center text-muted-foreground">
                                    app.axioma.mx/dashboard
                                </div>
                            </div>

                            {/* Mock Dashboard content */}
                            <div className="p-5 space-y-4 bg-background/50">
                                {/* KPI row */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: "Ventas del mes", value: "$248,000", trend: "+12%" },
                                        { label: "Por cobrar", value: "$82,400", trend: "-3%" },
                                        { label: "Órdenes", value: "143", trend: "+8%" },
                                    ].map((kpi) => (
                                        <div key={kpi.label} className="rounded-xl border border-border/60 bg-card p-3 space-y-1">
                                            <p className="text-xs text-muted-foreground">{kpi.label}</p>
                                            <p className="text-sm font-bold">{kpi.value}</p>
                                            <span className={`text-xs font-medium ${kpi.trend.startsWith("+") ? "text-green-500" : "text-red-400"}`}>
                                                {kpi.trend}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Fake chart */}
                                <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground">Tendencia de ventas</p>
                                    <div className="flex items-end gap-1.5 h-20">
                                        {[40, 65, 45, 80, 60, 90, 75, 95, 70, 88, 100, 85].map((h, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 rounded-sm bg-primary/20 hover:bg-primary/40 transition-colors"
                                                style={{ height: `${h}%` }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Fake table rows */}
                                <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/40 overflow-hidden">
                                    {["Orden #1042 · CEMEX SA", "Orden #1041 · Grupo Bimbo", "Orden #1040 · OXXO"].map((row) => (
                                        <div key={row} className="flex items-center justify-between px-3 py-2">
                                            <p className="text-xs text-muted-foreground">{row}</p>
                                            <span className="text-xs font-medium text-green-600 bg-green-50 rounded-full px-2 py-0.5">Activo</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Floating glow accent */}
                        <div className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-blue-500/10 blur-2xl" />
                    </div>
                </div>
            </div>
        </section>
    );
}
