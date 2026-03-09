"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
    { label: "Soluciones", href: "#soluciones" },
    { label: "Seguridad", href: "#seguridad" },
    { label: "Precios", href: "#pricing" },
    { label: "Contacto", href: "#contact" },
];

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-[--border] bg-[#0A0F1E]/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[--primary]">
                            <Zap className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-heading text-xl tracking-tight text-[--foreground]">Axioma</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-[--muted-foreground] transition-colors hover:text-[--foreground]"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="text-[--muted-foreground] hover:text-[--foreground] hover:bg-[--card]" asChild>
                            <Link href="/login">Iniciar prueba gratuita</Link>
                        </Button>
                        <Button size="sm" className="cta-hover bg-[--primary] hover:bg-[#1d4ed8] text-white" asChild>
                            <Link href="#contact">Ver demo en vivo</Link>
                        </Button>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden p-2 rounded text-[--muted-foreground] hover:text-[--foreground]"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden border-t border-[--border] bg-[#0A0F1E]/95 backdrop-blur-md">
                    <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className="text-sm font-medium text-[--muted-foreground] hover:text-[--foreground] py-2"
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-[--border]">
                            <Button variant="outline" asChild className="w-full border-[--border] text-[--foreground] hover:bg-[--card]">
                                <Link href="/login">Iniciar prueba gratuita</Link>
                            </Button>
                            <Button asChild className="w-full bg-[--primary] hover:bg-[#1d4ed8] text-white">
                                <Link href="#contact">Ver demo en vivo</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
