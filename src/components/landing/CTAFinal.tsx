import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";

export function CTAFinal() {
    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[--background]">
            <div className="mx-auto max-w-4xl">
                <div className="relative overflow-hidden rounded-lg border border-[--border] bg-gradient-to-br from-[--primary]/20 via-[--card] to-[--primary]/5 px-8 py-16 sm:px-16 text-center">
                    {/* Decorative orbs */}
                    <div className="absolute top-0 left-1/4 h-48 w-48 rounded-full bg-[--primary]/10 blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 h-40 w-40 rounded-full bg-[--color-accent]/10 blur-3xl" />

                    <div className="relative z-10 flex flex-col items-center gap-6">
                        <div className="p-3 rounded-lg bg-[--primary]/20">
                            <Sparkles className="h-6 w-6 text-[--color-accent]" />
                        </div>

                        <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl tracking-[-0.02em] text-[--foreground] max-w-2xl">
                            ¿Listo para dejar atrás las hojas de cálculo y los ERPs
                            genéricos?
                        </h2>

                        <p className="text-lg text-[--muted-foreground] max-w-xl">
                            Da el salto a la exactitud. Agenda una demostración
                            personalizada y descubre lo que Axioma puede hacer por tu
                            negocio.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 mt-2">
                            <Button
                                size="lg"
                                className="cta-hover gap-2 px-8 bg-[--primary] hover:bg-[#1d4ed8] text-white"
                                asChild
                            >
                                <Link href="#contact">
                                    <Play className="h-4 w-4" />
                                    Ver demo en vivo
                                </Link>
                            </Button>
                            <Button
                                size="lg"
                                variant="ghost"
                                className="cta-hover gap-2 px-8 text-[--foreground] hover:bg-white/10 border border-[--border] hover:border-[--primary]"
                                asChild
                            >
                                <Link href="/login">
                                    <ArrowRight className="h-4 w-4" />
                                    Iniciar prueba gratuita
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
