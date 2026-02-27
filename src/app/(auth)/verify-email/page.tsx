import Link from 'next/link'
import { MailCheck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
    return (
        <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)' }}>
                <MailCheck className="w-8 h-8" style={{ color: '#6366f1' }} />
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Revisa tu bandeja de entrada
            </h2>

            {/* Body */}
            <p className="mt-3 text-sm text-gray-500 leading-relaxed max-w-xs">
                Te enviamos un enlace de confirmación a tu correo electrónico. Haz clic en él para verificar tu cuenta y poder registrar tu empresa.
            </p>

            {/* Info box */}
            <div className="mt-5 w-full rounded-xl p-4 text-left"
                style={{ background: '#f8faff', border: '1px solid #e0e7ff' }}>
                <p className="text-xs text-indigo-700 font-medium mb-1">¿No encuentras el correo?</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                    Revisa tu carpeta de spam o correo no deseado. El enlace expira en 24 horas.
                </p>
            </div>

            {/* Actions */}
            <div className="mt-6 w-full space-y-3">
                <Button
                    variant="outline"
                    className="w-full h-10 text-sm border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                    type="button"
                >
                    Reenviar correo de verificación
                </Button>

                <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Volver al inicio de sesión
                </Link>
            </div>
        </div>
    )
}
