"use client";

import Link from "next/link";
import { useState } from "react";
import { Zap, Twitter, Linkedin, Github, Instagram, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const comingSoonLinks = new Set([
    "Blog",
    "Changelog",
    "Hoja de ruta",
    "Carreras",
    "Prensa",
]);

const footerLinks = {
    Producto: [
        { label: "Características", href: "#features" },
        { label: "Precios", href: "#pricing" },
        { label: "Changelog", href: "#" },
        { label: "Hoja de ruta", href: "#" },
    ],
    Empresa: [
        { label: "Sobre Axioma", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Carreras", href: "#" },
        { label: "Prensa", href: "#" },
    ],
    Legal: [
        { label: "Privacidad", href: "#" },
        { label: "Términos de uso", href: "#" },
        { label: "Cookies", href: "#" },
        { label: "CFDI & SAT", href: "#" },
    ],
};

const socials = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Instagram, href: "#", label: "Instagram" },
];

export function Footer() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    function handleSubscribe(e: React.FormEvent) {
        e.preventDefault();
        if (email) {
            setSubmitted(true);
        }
    }

    return (
        <footer id="contact" className="footer-dark border-t border-[--border] px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
                    {/* Brand column */}
                    <div className="lg:col-span-2 space-y-5">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[--primary]">
                                <Zap className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-heading text-xl tracking-tight text-[--foreground]">Axioma</span>
                        </Link>
                        <p className="text-sm text-[--muted-foreground] max-w-xs leading-relaxed">
                            El ERP con precisión matemática para las PyMEs de manufactura y
                            distribución en México. Factura sin rechazos, controla tu
                            producción y crece con datos reales.
                        </p>

                        {/* Newsletter */}
                        <div>
                            <p className="text-sm font-semibold text-[--foreground] mb-2">Suscríbete a nuestro newsletter</p>
                            {submitted ? (
                                <p className="text-sm text-emerald-400 font-medium">
                                    ¡Gracias! Te mantendremos al tanto.
                                </p>
                            ) : (
                                <form onSubmit={handleSubscribe} className="flex gap-2">
                                    <Input
                                        type="email"
                                        placeholder="tu@empresa.mx"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-9 text-sm bg-[--background] border-[--border] text-[--foreground] placeholder:text-[--muted-foreground]"
                                    />
                                    <Button type="submit" size="sm" className="gap-1.5 shrink-0 bg-[--primary] hover:bg-[#1d4ed8] text-white">
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Button>
                                </form>
                            )}
                            <p className="text-xs text-[--muted-foreground] mt-1.5">
                                Sin spam. Cancela cuando quieras.
                            </p>
                        </div>

                        {/* Socials */}
                        <div className="flex items-center gap-3">
                            {socials.map((s) => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    aria-label={s.label}
                                    className="p-2 rounded-lg text-[--muted-foreground] hover:text-[--foreground] hover:bg-white/5 transition-colors"
                                >
                                    <s.icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category} className="space-y-4">
                            <p className="text-sm font-semibold text-[--foreground]">{category}</p>
                            <ul className="space-y-2.5">
                                {links.map((link) => {
                                    const isComingSoon = comingSoonLinks.has(link.label);
                                    return (
                                        <li key={link.label}>
                                            {isComingSoon ? (
                                                <span className="text-sm text-[--muted-foreground]/50 cursor-default flex items-center gap-1.5">
                                                    {link.label}
                                                    <span className="text-[9px] uppercase tracking-wider font-medium bg-[--border] px-1.5 py-0.5 rounded text-[--muted-foreground]/60">
                                                        Próximamente
                                                    </span>
                                                </span>
                                            ) : (
                                                <Link
                                                    href={link.href}
                                                    className="text-sm text-[--muted-foreground] hover:text-[--foreground] transition-colors"
                                                >
                                                    {link.label}
                                                </Link>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-6 border-t border-[--border] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[--muted-foreground]">
                    <p>© {new Date().getFullYear()} Axioma ERP. Todos los derechos reservados.</p>
                    <p>Hecho con ❤️ en México 🇲🇽</p>
                </div>
            </div>
        </footer>
    );
}
