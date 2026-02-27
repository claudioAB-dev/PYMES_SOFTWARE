import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Axioma – Acceso',
    description: 'Inicia sesión o crea tu cuenta en Axioma ERP.',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen w-full flex">
            {/* ── Left Panel ─────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[56%] relative flex-col justify-between p-10 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>

                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />

                {/* Glow orbs */}
                <div className="absolute top-[-10%] left-[-5%] w-72 h-72 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
                />
                <div className="absolute bottom-[-5%] right-[-10%] w-96 h-96 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
                />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className="text-white text-xl font-semibold tracking-tight">Axioma</span>
                </div>

                {/* Center content */}
                <div className="relative z-10">
                    <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
                        El ERP que se adapta<br />
                        <span style={{ background: 'linear-gradient(90deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            a tu empresa.
                        </span>
                    </h1>
                    <p className="text-slate-400 text-base leading-relaxed max-w-xs">
                        Gestiona finanzas, nómina, inventario y más desde una sola plataforma diseñada para pymes mexicanas.
                    </p>

                    {/* Feature list */}
                    <ul className="mt-8 space-y-3">
                        {[
                            'Contabilidad y facturación CFDI',
                            'Nómina y recursos humanos',
                            'Inventario y compras',
                            'Reportes en tiempo real',
                        ].map((feat) => (
                            <li key={feat} className="flex items-center gap-3 text-slate-300 text-sm">
                                <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                                    style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.4)' }}>
                                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="2,6 5,9 10,3" />
                                    </svg>
                                </span>
                                {feat}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Testimonial */}
                <div className="relative z-10 rounded-2xl p-5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-slate-300 text-sm leading-relaxed italic">
                        &ldquo;Axioma transformó la forma en que administramos nuestra empresa. La automatización nos ahorra más de 10 horas a la semana.&rdquo;
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            MG
                        </div>
                        <div>
                            <p className="text-white text-xs font-medium">María González</p>
                            <p className="text-slate-500 text-xs">CFO · Distribuidora León S.A.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right Panel ────────────────────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-white">
                {/* Mobile logo (visible only on small screens) */}
                <div className="lg:hidden flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className="text-gray-900 text-lg font-semibold tracking-tight">Axioma</span>
                </div>

                <div className="w-full max-w-sm">
                    {children}
                </div>
            </div>
        </div>
    )
}
