"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
    { label: "Soluciones", href: "#soluciones" },
    { label: "Seguridad", href: "#seguridad" },
    { label: "Precios", href: "#pricing" },
    { label: "Contacto", href: "#contact" },
];

export function ContadoresNavbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <header
                className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E2E8F0]"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB]">
                                <Zap className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-heading text-xl tracking-tight text-[#0A0F1E]">
                                Axioma
                            </span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm font-medium text-[#334155] transition-colors hover:text-[#2563EB]"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Desktop CTA */}
                        <div className="hidden md:flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#334155] border border-[#CBD5E1] hover:bg-[#F1F5F9] hover:text-[#334155]"
                                asChild
                            >
                                <Link href="/login">
                                    Iniciar prueba gratuita
                                </Link>
                            </Button>
                            <Button
                                size="sm"
                                className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
                                asChild
                            >
                                <Link href="#contact">Ver demo en vivo</Link>
                            </Button>
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            className="md:hidden p-2 rounded text-[#334155] hover:text-[#0A0F1E]"
                            onClick={() => setIsOpen(!isOpen)}
                            aria-label="Toggle menu"
                        >
                            {isOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div
                        className="md:hidden border-t border-[#E2E8F0] bg-white"
                    >
                        <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="text-sm font-medium text-[#334155] hover:text-[#2563EB] py-2"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-[#E2E8F0]">
                                <Button
                                    variant="outline"
                                    asChild
                                    className="w-full border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]"
                                >
                                    <Link href="/login">
                                        Iniciar prueba gratuita
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    className="w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
                                >
                                    <Link href="#contact">
                                        Ver demo en vivo
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Breadcrumb bar */}
            <div className="fixed top-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-1.5">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#2563EB] transition-colors"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        Volver a axiomaerp.com
                    </Link>
                </div>
            </div>
        </>
    );
}
