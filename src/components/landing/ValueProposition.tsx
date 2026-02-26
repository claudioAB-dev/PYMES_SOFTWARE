import {
    Building2,
    ShieldCheck,
    Cloud,
    RefreshCcw,
    Globe2,
    BarChart3,
} from "lucide-react";

const pillars = [
    {
        icon: Building2,
        title: "Multi-empresa",
        description:
            "Administra varias razones sociales desde una sola cuenta. Cambia de contexto en segundos sin volver a iniciar sesión.",
    },
    {
        icon: ShieldCheck,
        title: "Roles y permisos granulares",
        description:
            "Define exactamente qué puede ver y hacer cada colaborador. Controla el acceso módulo por módulo.",
    },
    {
        icon: Cloud,
        title: "100% en la nube",
        description:
            "Sin instalaciones, sin servidores propios. Accede desde cualquier dispositivo, en cualquier lugar del mundo.",
    },
    {
        icon: RefreshCcw,
        title: "Siempre actualizado",
        description:
            "Las actualizaciones fiscales (CFDI, SAT) se aplican automáticamente. Nunca necesitas contratar un técnico.",
    },
    {
        icon: Globe2,
        title: "Diseñado para LATAM",
        description:
            "Configurado para las regulaciones de México y compatible con los requisitos fiscales de América Latina.",
    },
    {
        icon: BarChart3,
        title: "Reportes en tiempo real",
        description:
            "Dashboards ejecutivos, balances, flujo de caja y KPIs operativos disponibles en tiempo real, sin esperar.",
    },
];

export function ValueProposition() {
    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
            <div className="mx-auto max-w-7xl">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left text block */}
                    <div className="space-y-6">
                        <p className="text-sm font-semibold text-primary uppercase tracking-widest">
                            ¿Por qué Axioma?
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                            Un ERP que trabaja para ti,{" "}
                            <span className="text-muted-foreground">no al revés.</span>
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Los sistemas ERP tradicionales son rígidos, costosos y requieren
                            meses de implementación. Axioma rompe ese paradigma: modular,
                            intuitivo y listo para operar desde el primer día.
                        </p>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-4 pt-4">
                            {[
                                { value: "< 1 día", label: "Tiempo de implementación" },
                                { value: "99.9%", label: "Disponibilidad SLA" },
                                { value: "0 $", label: "Costo de mantenimiento" },
                            ].map((stat) => (
                                <div key={stat.label} className="space-y-1">
                                    <p className="text-2xl font-extrabold">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right grid of pillars */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {pillars.map((pillar, i) => (
                            <div
                                key={pillar.title}
                                className="group flex gap-4 p-4 rounded-xl border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
                                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
                            >
                                <div className="mt-0.5 flex-shrink-0 p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    <pillar.icon className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{pillar.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        {pillar.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
