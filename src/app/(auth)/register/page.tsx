'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Briefcase, Calculator } from 'lucide-react'

import { signup } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'

const registerSchema = z
    .object({
        name: z
            .string()
            .min(2, 'El nombre debe tener al menos 2 caracteres.'),
        email: z.string().email('Ingresa un correo electrónico válido.'),
        password: z
            .string()
            .min(8, 'La contraseña debe tener al menos 8 caracteres.')
            .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula.')
            .regex(/[0-9]/, 'Debe incluir al menos un número.'),
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: 'Las contraseñas no coinciden.',
        path: ['confirmPassword'],
    })

type RegisterValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const [isPending, startTransition] = useTransition()
    const [role, setRole] = useState<'business' | 'accountant'>('business')
    const router = useRouter()

    const form = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    })

    function onSubmit(values: RegisterValues) {
        startTransition(async () => {
            const res = await signup({
                name: values.name,
                email: values.email,
                password: values.password,
                isAccountant: role === 'accountant'
            })
            if (res?.error) {
                toast.error('No se pudo crear la cuenta', {
                    description: res.error,
                })
            } else {
                router.push('/verify-email')
            }
        })
    }

    return (
        <div suppressHydrationWarning>
            {/* Header */}
            <div className="mb-7">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Crea tu cuenta
                </h2>
                <p className="mt-1.5 text-sm text-gray-500">
                    Comienza gratis. Sin tarjeta de crédito.
                </p>
            </div>

            <Tabs defaultValue="business" className="mb-6 w-full" onValueChange={(val) => setRole(val as any)}>
                <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100 rounded-lg">
                    <TabsTrigger
                        value="business"
                        className="rounded-md flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-medium transition-all"
                    >
                        <Briefcase className="w-4 h-4" />
                        Negocio
                    </TabsTrigger>
                    <TabsTrigger
                        value="accountant"
                        className="rounded-md flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-medium transition-all"
                    >
                        <Calculator className="w-4 h-4" />
                        Soy Contador
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate suppressHydrationWarning>
                    {/* Full name */}
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700">
                                    Nombre completo
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Juan García"
                                        autoComplete="name"
                                        data-invalid={!!fieldState.error}
                                        className="h-10 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 data-[invalid=true]:border-red-400 data-[invalid=true]:focus:ring-red-400/20 transition-all"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />

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
                                <FormLabel className="text-sm font-medium text-gray-700">
                                    Contraseña
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="Min. 8 caracteres"
                                        autoComplete="new-password"
                                        data-invalid={!!fieldState.error}
                                        className="h-10 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 data-[invalid=true]:border-red-400 data-[invalid=true]:focus:ring-red-400/20 transition-all"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        )}
                    />

                    {/* Confirm Password */}
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700">
                                    Confirmar contraseña
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="Repite tu contraseña"
                                        autoComplete="new-password"
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
                            'Crear cuenta →'
                        )}
                    </Button>

                    <p className="text-center text-xs text-gray-400 leading-relaxed">
                        Al registrarte aceptas nuestros{' '}
                        <span className="text-indigo-600 cursor-pointer hover:underline">
                            Términos de Servicio
                        </span>{' '}
                        y{' '}
                        <span className="text-indigo-600 cursor-pointer hover:underline">
                            Política de Privacidad
                        </span>.
                    </p>
                </form>
            </Form>

            {/* Footer link */}
            <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                    ¿Ya tienes cuenta?{' '}
                    <Link
                        href="/login"
                        className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    )
}
