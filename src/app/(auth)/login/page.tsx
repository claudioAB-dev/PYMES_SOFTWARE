'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { login } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'

const loginSchema = z.object({
    email: z.string().email('Ingresa un correo electrónico válido.'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const [isPending, startTransition] = useTransition()

    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    })

    function onSubmit(values: LoginValues) {
        startTransition(async () => {
            const res = await login(values)
            if (res?.error) {
                toast.error(res.error, {
                    description: 'Verifica tus credenciales e intenta de nuevo.',
                })
            }
        })
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-7">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Bienvenido de nuevo
                </h2>
                <p className="mt-1.5 text-sm text-gray-500">
                    Ingresa tus credenciales para acceder a tu cuenta.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    {/* Email */}
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700">
                                    Correo electrónico
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder="tu@empresa.com"
                                        autoComplete="email"
                                        data-invalid={!!fieldState.error}
                                        className="h-10 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 data-[invalid=true]:border-red-400 data-[invalid=true]:focus:ring-red-400/20 transition-all"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />

                    {/* Password */}
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <div className="flex items-center justify-between">
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        Contraseña
                                    </FormLabel>
                                    <span className="text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer">
                                        ¿Olvidaste tu contraseña?
                                    </span>
                                </div>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        data-invalid={!!fieldState.error}
                                        className="h-10 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 data-[invalid=true]:border-red-400 data-[invalid=true]:focus:ring-red-400/20 transition-all"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="w-full h-10 mt-2 font-medium text-sm"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            'Iniciar sesión'
                        )}
                    </Button>
                </form>
            </Form>

            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100" />
                </div>
            </div>

            {/* Footer link */}
            <p className="text-center text-sm text-gray-500">
                ¿No tienes cuenta?{' '}
                <Link
                    href="/register"
                    className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                    Regístrate gratis →
                </Link>
            </p>
        </div>
    )
}
