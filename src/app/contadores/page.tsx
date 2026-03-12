import Link from "next/link";
import { ContadoresNavbar } from "./contadores-navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    ArrowRight,
    ArrowLeft,
    Play,
    CloudLightning,
    Vault,
    Users,
    Building2,
    UserPlus,
    Send,
    Coins,
    ShieldCheck,
    Calculator,
    Award,
    Handshake,
    MessageCircleQuestion,
    CircleDot,
    Lock,
    FileCheck,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                              Metadata (SEO)                                */
/* -------------------------------------------------------------------------- */

export const metadata = {
    title: "Programa de Contadores Aliados | Axioma ERP",
    description:
        "Únete al Programa de Contadores Aliados de Axioma. Refiere PyMEs, gana comisiones recurrentes y protege tu reputación profesional con el ERP fiscal más preciso de México.",
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
        title: "Te unes al programa",
        description:
            "Regístrate como Contador Aliado. Toma 10 segundos. Sin tarjeta de crédito.",
        color: "text-sky-500",
        bg: "bg-sky-50 dark:bg-sky-950/30",
    },
    {
        number: "02",
        icon: Send,
        title: "Refieres a tus clientes",
        description:
            "Comparte tu enlace único de Axioma. Cuando tus clientes se registran, quedan vinculados a tu cuenta automáticamente.",
        color: "text-violet-500",
        bg: "bg-violet-50 dark:bg-violet-950/30",
    },
    {
        number: "03",
        icon: Coins,
        title: "Tus clientes operan. Tú cobras.",
        description:
            "Cada empresa que registres genera una comisión mensual automática. Sin intervención manual. Tu panel muestra en tiempo real cuántas empresas tienes activas y cuánto se acreditará este mes.",
        color: "text-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
];

const COMISION_POR_EMPRESA = 300;

const commissionCards = [
    {
        empresas: 2,
        comision: "$600",
        label: "Umbral mínimo de activación",
        highlighted: false,
    },
    {
        empresas: 5,
        comision: "$1,500",
        label: "El despacho promedio",
        highlighted: true,
    },
    {
        empresas: 10,
        comision: "$3,000",
        label: "Ingreso pasivo real",
        highlighted: false,
    },
];

const faqs = [
    {
        question:
            "¿Mis clientes necesitan que yo los acompañe en la implementación?",
        answer: "No. Axioma está listo en menos de 1 día. Tu cliente entra, configura su empresa y puede facturar el mismo día.",
    },
    {
        question: "¿Qué pasa si un cliente cancela su suscripción?",
        answer: "La comisión de ese cliente se detiene ese mes. No hay penalizaciones para ti.",
    },
    {
        question:
            "¿Necesito ser usuario de Axioma para recomendar el sistema?",
        answer: "No es obligatorio, pero recomendamos que abras una cuenta gratuita de despacho para que puedas ver el sistema que le estás recomendando a tus clientes.",
    },
    {
        question:
            "¿Axioma tiene módulo de manufactura? Algunos de mis clientes fabrican.",
        answer: "Sí. Axioma Manufactura es el módulo más avanzado del sistema. Incluye BOM dinámica, órdenes de producción transaccionales y calculadora de costo real por lote. Tus clientes manufactureros son los que más se benefician.",
    },
];

/* -------------------------------------------------------------------------- */
/*                               Page Component                               */
/* -------------------------------------------------------------------------- */

export default function ContadoresPage() {
    return (
        <div className="min-h-screen bg-background antialiased">
            <ContadoresNavbar />

            <main>
                {/* ================================================================ */}
                {/*  HERO SECTION                                                    */}
                {/* ================================================================ */}
                <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-24">
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
                                <Handshake className="h-3 w-3 text-amber-500" />
                                <span>Programa de Contadores Aliados</span>
                            </Badge>

                            {/* Headline (Point 2) */}
                            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight text-foreground max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                                Tu reputación profesional no debería depender{" "}
                                <span className="bg-gradient-to-r from-sky-500 to-violet-600 bg-clip-text text-transparent">
                                    del ERP que usa tu cliente.
                                </span>
                            </h1>

                            {/* Subtitle (Point 2) */}
                            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                                Axioma es el único ERP con motor matemático a 6
                                decimales y bóveda CSD de grado militar. Cuando
                                tus clientes usan Axioma, los problemas fiscales
                                desaparecen — y tú te llevas el crédito.
                            </p>

                            {/* CTAs (Point 6) */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                                <Button
                                    size="lg"
                                    className="gap-2 px-8 text-base"
                                    asChild
                                >
                                    <Link href="/register?role=accountant">
                                        Unirme al Programa de Contadores
                                        Aliados
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="gap-2 px-8 text-base"
                                    asChild
                                >
                                    <Link href="#programa">
                                        Ver cómo funciona el programa
                                    </Link>
                                </Button>
                                <Button
                                    size="lg"
                                    variant="ghost"
                                    className="gap-2 px-8 text-base"
                                    asChild
                                >
                                    <Link href="#demo">
                                        <Play className="h-4 w-4" />
                                        Ver demo del sistema
                                    </Link>
                                </Button>
                            </div>

                            {/* Technical credentials (Point 1) */}
                            <div className="flex flex-wrap items-center justify-center gap-6 mt-2 text-sm text-muted-foreground animate-in fade-in duration-1000 delay-500">
                                <div className="flex items-center gap-2">
                                    <CircleDot className="h-4 w-4 text-sky-500" />
                                    <span>
                                        Motor CFDI 4.0 · Cálculo a 6 decimales
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-violet-500" />
                                    <span>
                                        Bóveda CSD · Cifrado AES-256
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FileCheck className="h-4 w-4 text-emerald-500" />
                                    <span>
                                        0 rechazos del PAC garantizados
                                    </span>
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
                                <span className="text-muted-foreground">
                                    listos para usar
                                </span>
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                                Herramientas diseñadas desde cero para el flujo
                                real de un contador que maneja múltiples
                                empresas.
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
                                            <div
                                                className={`p-3 rounded-xl ${b.bg}`}
                                            >
                                                <b.icon
                                                    className={`h-6 w-6 ${b.color}`}
                                                />
                                            </div>
                                        </div>
                                        <h3 className="mt-4 text-lg font-semibold">
                                            {b.title}
                                        </h3>
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
                <section
                    id="programa"
                    className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30"
                >
                    <div className="mx-auto max-w-5xl">
                        {/* Section header */}
                        <div className="text-center mb-16">
                            <Badge variant="outline" className="mb-4">
                                ¿Cómo funciona?
                            </Badge>
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                                Tres pasos para empezar{" "}
                                <span className="text-muted-foreground">
                                    a generar ingresos
                                </span>
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                                Sin curvas de aprendizaje. Sin migraciones
                                dolorosas. Solo resultados.
                            </p>
                        </div>

                        {/* Steps (Point 5 — Step 3 updated) */}
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
                                            <step.icon
                                                className={`h-8 w-8 ${step.color}`}
                                            />
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
                {/*  PARTNER PROGRAM — COMMISSION CARDS (Point 3)                     */}
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
                                <Calculator className="h-3 w-3 text-amber-400" />
                                <span>Programa de Partners</span>
                            </Badge>
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                                Gana mientras tus clientes{" "}
                                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                                    crecen.
                                </span>
                            </h2>
                            <p className="mt-5 text-base sm:text-lg text-background/70 max-w-2xl mx-auto leading-relaxed">
                                Por cada empresa que registres en Axioma y
                                mantenga su suscripción activa, recibes una{" "}
                                <strong className="text-background font-semibold">
                                    comisión mensual recurrente
                                </strong>
                                . Automática. Sin papeleo.
                            </p>
                        </div>

                        {/* Commission cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            {commissionCards.map((card, index) => (
                                <Card
                                    key={card.empresas}
                                    className={`relative overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${card.highlighted
                                        ? "bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-400/40 shadow-lg shadow-amber-500/10 scale-[1.03]"
                                        : "bg-background/5 border-background/10 hover:bg-background/10"
                                        }`}
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                        animationFillMode: "both",
                                    }}
                                >
                                    {card.highlighted && (
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
                                    )}
                                    <CardHeader className="pb-2 text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <Building2
                                                className={`h-5 w-5 ${card.highlighted ? "text-amber-400" : "text-background/50"}`}
                                            />
                                            <span className="text-lg font-bold text-background">
                                                {card.empresas} empresas
                                                activas
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="text-center space-y-3">
                                        <div>
                                            <p className="text-xs text-background/50 uppercase tracking-wider mb-1">
                                                Comisión estimada
                                            </p>
                                            <p
                                                className={`text-3xl font-extrabold ${card.highlighted ? "text-amber-400" : "text-background"}`}
                                            >
                                                {card.comision}
                                                {" "}
                                                <span className="text-base font-medium text-background/50">
                                                    MXN/mes
                                                </span>
                                            </p>
                                        </div>
                                        <p
                                            className={`text-sm ${card.highlighted ? "text-amber-300/80" : "text-background/50"}`}
                                        >
                                            {card.label}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Disclaimer text */}
                        <p className="text-center text-sm text-background/40 max-w-2xl mx-auto leading-relaxed mb-10">
                            $300 MXN por empresa activa, cada mes. Automático.
                            Sin papeleo.
                        </p>

                        {/* Micro CTA */}
                        <div className="text-center">
                            <Button
                                size="lg"
                                variant="ghost"
                                className="gap-2 px-8 text-base border border-white/25 text-white hover:bg-white/10 hover:text-white"
                                asChild
                            >
                                <Link href="/register?role=accountant">
                                    Unirme al Programa de Contadores Aliados
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* ================================================================ */}
                {/*  BADGE SECTION (Point 4)                                          */}
                {/* ================================================================ */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border/40">
                    <div className="mx-auto max-w-4xl">
                        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                            {/* Badge visual mockup */}
                            <div className="shrink-0">
                                <div className="relative w-56 h-64 rounded-2xl border-2 border-border/60 bg-gradient-to-br from-background to-muted/50 p-6 flex flex-col items-center justify-center gap-4 shadow-xl">
                                    {/* Decorative glow */}
                                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-sky-500/10 to-violet-500/10 -z-10 blur-sm" />

                                    {/* Logo */}
                                    <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-primary">
                                        <ShieldCheck className="h-7 w-7 text-white" />
                                    </div>

                                    {/* Badge text */}
                                    <div className="text-center space-y-1">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                            Axioma
                                        </p>
                                        <p className="text-base font-bold text-foreground leading-tight">
                                            Contador Aliado
                                            <br />
                                            Certificado
                                        </p>
                                    </div>

                                    {/* Award icon */}
                                    <Award className="h-6 w-6 text-amber-500" />

                                    {/* Shine effect */}
                                    <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-sky-500/10 blur-md" />
                                </div>
                            </div>

                            {/* Badge copy */}
                            <div className="space-y-5 text-center lg:text-left">
                                <Badge variant="outline" className="mb-2">
                                    <Award className="h-3 w-3 mr-1.5 text-amber-500" />
                                    Exclusivo para aliados
                                </Badge>

                                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                                    Algo que puedes presumir{" "}
                                    <span className="text-muted-foreground">
                                        con tus clientes.
                                    </span>
                                </h2>

                                <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                                    Los contadores aliados de Axioma reciben un
                                    badge digital{" "}
                                    <strong className="text-foreground">
                                        &ldquo;Contador Axioma
                                        Certificado&rdquo;
                                    </strong>{" "}
                                    para su perfil de LinkedIn, firma de correo y
                                    materiales del despacho. Una señal de que
                                    usas las herramientas más precisas del
                                    mercado.
                                </p>

                                <Button
                                    size="lg"
                                    className="gap-2 px-8 text-base"
                                    asChild
                                >
                                    <Link href="/register?role=accountant">
                                        Quiero ser Contador Axioma Certificado
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================================================================ */}
                {/*  FAQ / OBJECTIONS SECTION (Point 7)                               */}
                {/* ================================================================ */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
                    <div className="mx-auto max-w-3xl">
                        {/* Section header */}
                        <div className="text-center mb-12">
                            <Badge variant="outline" className="mb-4">
                                <MessageCircleQuestion className="h-3 w-3 mr-1.5" />
                                Preguntas frecuentes
                            </Badge>
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                                Resolvemos tus dudas{" "}
                                <span className="text-muted-foreground">
                                    antes de que las tengas.
                                </span>
                            </h2>
                        </div>

                        {/* Accordion */}
                        <Accordion
                            type="single"
                            collapsible
                            className="w-full space-y-3"
                        >
                            {faqs.map((faq, index) => (
                                <AccordionItem
                                    key={index}
                                    value={`faq-${index}`}
                                    className="bg-background border border-border/60 rounded-xl px-6 data-[state=open]:shadow-md transition-shadow"
                                >
                                    <AccordionTrigger className="text-left text-base font-semibold hover:no-underline py-5">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </section>

                {/* ================================================================ */}
                {/*  FINAL CTA (Point 6)                                              */}
                {/* ================================================================ */}
                <section className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
                    {/* Background accents */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-sky-500/8 blur-3xl" />
                        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-violet-500/6 blur-3xl" />
                    </div>

                    <div className="mx-auto max-w-3xl text-center space-y-8">
                        <Badge
                            variant="secondary"
                            className="gap-1.5 px-3 py-1.5"
                        >
                            <Handshake className="h-3 w-3 text-amber-500" />
                            <span>Únete hoy mismo</span>
                        </Badge>

                        <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight">
                            Tu despacho merece una nueva{" "}
                            <span className="bg-gradient-to-r from-sky-500 to-violet-600 bg-clip-text text-transparent">
                                línea de ingresos.
                            </span>
                        </h2>

                        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                            Únete al Programa de Contadores Aliados, refiere
                            PyMEs a Axioma y genera comisiones recurrentes cada
                            mes. Sin riesgo, sin inversión, sin complicaciones.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Button
                                size="lg"
                                className="gap-2 px-10 py-6 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
                                asChild
                            >
                                <Link href="/register?role=accountant">
                                    Unirme al Programa de Contadores Aliados
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Sin tarjeta de crédito · Alta en 10 segundos · Sin
                            permanencia mínima
                        </p>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
