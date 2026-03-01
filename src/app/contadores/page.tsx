import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowRight,
    Play,
    CloudLightning,
    Vault,
    Users,
    Building2,
    UserPlus,
    Send,
    Sparkles,
    ShieldCheck,
    CheckCircle2,
    TrendingUp,
    Coins,
    Handshake,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                              Metadata (SEO)                                */
/* -------------------------------------------------------------------------- */

export const metadata = {
    title: "Axioma para Contadores y Despachos | ERP Fiscal Inteligente",
    description:
        "Centraliza la contabilidad de todas tus PyMEs. Descarga masiva del SAT, bóveda fiscal automática y colaboración sin fricción con tus clientes.",
};

/* -------------------------------------------------------------------------- */
/*                                   Data                                     */
/* -------------------------------------------------------------------------- */

const benefits = [
    {
        icon: CloudLightning,
        title: "Descarga Masiva Anti-Timeouts",
        description:
            "Olvídate de las caídas del portal. Nuestro motor asíncrono descarga miles de XMLs en segundo plano mientras tú tomas un café.",
        color: "text-sky-500",
        bg: "bg-sky-50 dark:bg-sky-950/30",
        gradient: "from-sky-500/10 to-sky-500/0",
    },
    {
        icon: Vault,
        title: "Bóveda Fiscal Automática",
        description:
            "No más archivos perdidos. Axioma extrae mágicamente los subtotales, impuestos y folios de cada CFDI 4.0 y los organiza en tablas matemáticas listas para auditar.",
        color: "text-violet-500",
        bg: "bg-violet-50 dark:bg-violet-950/30",
        gradient: "from-violet-500/10 to-violet-500/0",
    },
    {
        icon: Users,
        title: "Centro de Mando Multicliente",
        description:
            "Maneja 5 o 50 empresas sin cerrar sesión. Cambia el contexto de toda la plataforma con un solo clic y visualiza solo la información del cliente activo.",
        color: "text-amber-500",
        bg: "bg-amber-50 dark:bg-amber-950/30",
        gradient: "from-amber-500/10 to-amber-500/0",
    },
    {
        icon: Building2,
        title: "Onboarding Orgánico (Invitación Inversa)",
        description:
            "Envía un enlace único a tus clientes. Cuando ellos se registran, su empresa aparece automáticamente en tu portafolio. Cero configuraciones manuales.",
        color: "text-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        gradient: "from-emerald-500/10 to-emerald-500/0",
    },
];

const steps = [
    {
        number: "01",
        icon: UserPlus,
        title: "Creas tu cuenta de despacho",
        description: "Toma 10 segundos. Sin tarjeta de crédito.",
        color: "text-sky-500",
        bg: "bg-sky-50 dark:bg-sky-950/30",
    },
    {
        number: "02",
        icon: Send,
        title: "Envías tu link de invitación",
        description:
            "Comparte un enlace único con cada cliente. Ellos se registran y aparecen en tu portafolio al instante.",
        color: "text-violet-500",
        bg: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
        number: "03",
        icon: Sparkles,
        title: "Axioma hace el resto",
        description:
            "Descarga y clasifica toda la historia fiscal automáticamente. Tú solo revisas los resultados.",
        color: "text-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
];

/* -------------------------------------------------------------------------- */
/*                               Page Component                               */
/* -------------------------------------------------------------------------- */

export default function ContadoresPage() {
    return (
        <div className="min-h-screen bg-background antialiased">
            <Navbar />

            <main>
                {/* ================================================================ */}
                {/*  HERO SECTION                                                    */}
                {/* ================================================================ */}
                <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-16">
                    {/* Background gradient blobs */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-sky-500/6 blur-3xl" />
                        <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-violet-500/6 blur-3xl" />
                        <div className="absolute top-1/3 right-0 h-72 w-72 rounded-full bg-emerald-500/5 blur-3xl" />
                    </div>

                    <div className="mx-auto max-w-5xl w-full py-20 md:py-28 lg:py-32">
                        <div className="flex flex-col items-center text-center gap-8">
                            {/* Badge */}
                            <Badge
                                variant="secondary"
                                className="gap-1.5 px-3 py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500"
                            >
                                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                <span>Diseñado exclusivamente para contadores</span>
                            </Badge>

                            {/* Headline */}
                            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight text-foreground max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                                El ERP que trabaja para el contador,{" "}
                                <span className="bg-gradient-to-r from-sky-500 to-violet-600 bg-clip-text text-transparent">
                                    no al revés.
                                </span>
                            </h1>

                            {/* Subtitle */}
                            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                                Centraliza la contabilidad de todas tus PyMEs en un solo lugar.
                                Sincronización masiva del SAT, bóveda fiscal inteligente y
                                colaboración sin fricción con tus clientes.
                            </p>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                                <Button size="lg" className="gap-2 px-8 text-base" asChild>
                                    <Link href="/register?role=accountant">
                                        Comenzar gratis como Contador
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="gap-2 px-8 text-base"
                                    asChild
                                >
                                    <Link href="#demo">
                                        <Play className="h-4 w-4" />
                                        Ver demostración
                                    </Link>
                                </Button>
                            </div>

                            {/* Social proof */}
                            <div className="flex flex-wrap items-center justify-center gap-6 mt-2 text-sm text-muted-foreground animate-in fade-in duration-1000 delay-500">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>+200 despachos activos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-sky-500" />
                                    <span>SAT certificado</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CloudLightning className="h-4 w-4 text-amber-500" />
                                    <span>99.9% uptime</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================================================================ */}
                {/*  BENEFITS GRID                                                   */}
                {/* ================================================================ */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border/40">
                    <div className="mx-auto max-w-7xl">
                        {/* Section header */}
                        <div className="text-center mb-16">
                            <Badge variant="outline" className="mb-4">
                                Características clave
                            </Badge>
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                                Superpoderes para tu despacho,{" "}
                                <span className="text-muted-foreground">listos para usar</span>
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                                Herramientas diseñadas desde cero para el flujo real de un
                                contador que maneja múltiples empresas.
                            </p>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {benefits.map((b, index) => (
                                <Card
                                    key={b.title}
                                    className="group relative overflow-hidden border-border/60 hover:border-border hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                        animationFillMode: "both",
                                    }}
                                >
                                    {/* Top gradient bar */}
                                    <div
                                        className={`h-1 w-full bg-gradient-to-r ${b.gradient} opacity-60 group-hover:opacity-100 transition-opacity`}
                                    />

                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div className={`p-3 rounded-xl ${b.bg}`}>
                                                <b.icon className={`h-6 w-6 ${b.color}`} />
                                            </div>
                                        </div>
                                        <h3 className="mt-4 text-lg font-semibold">{b.title}</h3>
                                    </CardHeader>

                                    <CardContent>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {b.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ================================================================ */}
                {/*  WORKFLOW / PASO A PASO                                          */}
                {/* ================================================================ */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
                    <div className="mx-auto max-w-5xl">
                        {/* Section header */}
                        <div className="text-center mb-16">
                            <Badge variant="outline" className="mb-4">
                                ¿Cómo funciona?
                            </Badge>
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                                Tres pasos para digitalizar{" "}
                                <span className="text-muted-foreground">tu despacho</span>
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                                Sin curvas de aprendizaje. Sin migraciones dolorosas. Solo
                                resultados.
                            </p>
                        </div>

                        {/* Steps */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {steps.map((step, index) => (
                                <div
                                    key={step.number}
                                    className="relative flex flex-col items-center text-center gap-4 animate-in fade-in slide-in-from-bottom-4"
                                    style={{
                                        animationDelay: `${index * 120}ms`,
                                        animationFillMode: "both",
                                    }}
                                >
                                    {/* Connector line (between steps on desktop) */}
                                    {index < steps.length - 1 && (
                                        <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px border-t-2 border-dashed border-border/50" />
                                    )}

                                    {/* Step number ring */}
                                    <div className="relative">
                                        <div
                                            className={`flex items-center justify-center h-20 w-20 rounded-2xl ${step.bg} border border-border/40`}
                                        >
                                            <step.icon className={`h-8 w-8 ${step.color}`} />
                                        </div>
                                        <span className="absolute -top-2 -right-2 flex items-center justify-center h-7 w-7 rounded-full bg-foreground text-background text-xs font-bold">
                                            {step.number}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-semibold mt-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                                        {step.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ================================================================ */}
                {/*  PARTNER PROGRAM                                                  */}
                {/* ================================================================ */}
                <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-foreground text-background overflow-hidden">
                    {/* Background accents */}
                    <div className="absolute inset-0 -z-0 opacity-30">
                        <div className="absolute top-0 right-1/4 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />
                        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
                    </div>

                    <div className="relative z-10 mx-auto max-w-6xl">
                        {/* Section header */}
                        <div className="text-center mb-14">
                            <Badge className="mb-4 bg-background/10 text-background border-background/20 hover:bg-background/15 gap-1.5 px-3 py-1.5">
                                <Handshake className="h-3 w-3 text-amber-400" />
                                <span>Programa de Partners</span>
                            </Badge>
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                                Tu portafolio crece,{" "}
                                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                                    tus ingresos también.
                                </span>
                                <br className="hidden sm:block" />
                                Únete al Programa de Partners.
                            </h2>
                            <p className="mt-5 text-base sm:text-lg text-background/70 max-w-2xl mx-auto leading-relaxed">
                                No solo te damos la mejor herramienta fiscal. Te recompensamos
                                por cada PyME que sumes a Axioma con una{" "}
                                <strong className="text-background font-semibold">bonificación mensual recurrente</strong>{" "}
                                mientras el cliente siga activo.
                            </p>
                        </div>

                        {/* Benefits grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            {[
                                {
                                    icon: Coins,
                                    title: "Ingreso Pasivo",
                                    description:
                                        "Gana una comisión mensual por cada suscripción activa de tus clientes. Mientras ellos crecen, tú también.",
                                    iconColor: "text-amber-400",
                                    iconBg: "bg-amber-400/10",
                                },
                                {
                                    icon: TrendingUp,
                                    title: "Cero Fricción",
                                    description:
                                        "El pago se calcula y se acredita automáticamente en tu panel de Axioma. Sin facturas extra, sin papeleo.",
                                    iconColor: "text-sky-400",
                                    iconBg: "bg-sky-400/10",
                                },
                                {
                                    icon: Handshake,
                                    title: "Ganan Ambos",
                                    description:
                                        "Tus clientes obtienen un ERP de primer nivel, tú optimizas tu tiempo y generas una nueva línea de ingresos para tu despacho.",
                                    iconColor: "text-emerald-400",
                                    iconBg: "bg-emerald-400/10",
                                },
                            ].map((perk, index) => (
                                <Card
                                    key={perk.title}
                                    className="bg-background/5 border-background/10 hover:bg-background/10 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                        animationFillMode: "both",
                                    }}
                                >
                                    <CardHeader className="pb-2">
                                        <div className={`p-3 rounded-xl ${perk.iconBg} w-fit`}>
                                            <perk.icon className={`h-6 w-6 ${perk.iconColor}`} />
                                        </div>
                                        <h3 className="mt-4 text-lg font-semibold text-background">
                                            {perk.title}
                                        </h3>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-background/60 leading-relaxed">
                                            {perk.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Micro CTA */}
                        <div className="text-center">
                            <Button
                                size="lg"
                                variant="ghost"
                                className="gap-2 px-8 text-base border border-white/25 text-white hover:bg-white/10 hover:text-white"
                                asChild
                            >
                                <Link href="/register?role=accountant">
                                    Conocer detalles del programa
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* ================================================================ */}
                {/*  FINAL CTA                                                       */}
                {/* ================================================================ */}
                <section className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
                    {/* Background accents */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-sky-500/8 blur-3xl" />
                        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-violet-500/6 blur-3xl" />
                    </div>

                    <div className="mx-auto max-w-3xl text-center space-y-8">
                        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                            <Sparkles className="h-3 w-3 text-amber-500" />
                            <span>Comienza hoy mismo</span>
                        </Badge>

                        <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight">
                            Eleva el nivel de tu despacho hoy.{" "}
                            <span className="bg-gradient-to-r from-sky-500 to-violet-600 bg-clip-text text-transparent">
                                Lleva la contabilidad al futuro.
                            </span>
                        </h2>

                        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                            Únete a cientos de despachos que ya automatizaron la descarga
                            fiscal, eliminaron el caos de archivos y recuperaron horas cada
                            semana.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Button
                                size="lg"
                                className="gap-2 px-10 py-6 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
                                asChild
                            >
                                <Link href="/register?role=accountant">
                                    Crear mi cuenta de despacho gratis
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Sin tarjeta de crédito · Configuración en 10 segundos ·
                            Cancela cuando quieras
                        </p>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
