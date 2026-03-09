import { DM_Serif_Display, IBM_Plex_Sans } from "next/font/google";
import type { Metadata } from "next";
import "./landing.css";

const dmSerif = DM_Serif_Display({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-heading",
    display: "swap",
});

const ibmPlex = IBM_Plex_Sans({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
    variable: "--font-body",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Axioma ERP | Cero rechazos del SAT. Costo real por lote.",
    description:
        "El ERP con precisión matemática a 6 decimales para PyMEs de manufactura y distribución en México. Bóveda CSD AES-256, CFDI 4.0 sin rechazos, y costo real por lote.",
};

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            className={`${dmSerif.variable} ${ibmPlex.variable} landing-theme font-body antialiased`}
        >
            {children}
        </div>
    );
}
