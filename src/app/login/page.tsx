'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { login, signup } from './actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const authSchema = z.object({
    email: z.string().email('Por favor ingresa un correo electrónico válido.'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
})

type AuthFormValues = z.infer<typeof authSchema>

export default function LoginPage() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const loginForm = useForm<AuthFormValues>({
        resolver: zodResolver(authSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const signupForm = useForm<AuthFormValues>({
        resolver: zodResolver(authSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const onLoginSubmit = (values: AuthFormValues) => {
        setError(null)
        startTransition(async () => {
            const res = await login(values)
            if (res?.error) {
                setError(res.error)
            }
        })
    }

    const onSignupSubmit = (values: AuthFormValues) => {
        setError(null)
        startTransition(async () => {
            const res = await signup(values)
            if (res?.error) {
                setError(res.error)
            }
        })
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <div className="w-full max-w-md">
                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                        <TabsTrigger value="register">Crear Cuenta</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Bienvenido de nuevo</CardTitle>
                                <CardDescription>
                                    Ingresa tus credenciales para acceder a tu cuenta.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...loginForm}>
                                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                                        <FormField
                                            control={loginForm.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Correo Electrónico</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="tu@empresa.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={loginForm.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Contraseña</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" placeholder="••••••••" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        {error && (
                                            <div className="text-sm font-medium text-destructive mt-2">
                                                {error}
                                            </div>
                                        )}
                                        <Button type="submit" className="w-full" disabled={isPending}>
                                            {isPending ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="register" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Crea una nueva cuenta</CardTitle>
                                <CardDescription>
                                    Ingresa tus datos para registrar una nueva cuenta.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...signupForm}>
                                    <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                                        <FormField
                                            control={signupForm.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Correo Electrónico</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="tu@empresa.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={signupForm.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Contraseña</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" placeholder="••••••••" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        {error && (
                                            <div className="text-sm font-medium text-destructive mt-2">
                                                {error}
                                            </div>
                                        )}
                                        <Button type="submit" className="w-full" disabled={isPending}>
                                            {isPending ? 'Creando cuenta...' : 'Crear Cuenta'}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
