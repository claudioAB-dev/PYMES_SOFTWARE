"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, Mail, Shield, UserPlus, LogIn } from "lucide-react"
import Link from "next/link"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import { acceptInvite, acceptInviteExistingUser } from "@/app/dashboard/settings/team/actions"

// ── Schemas ────────────────────────────────────────────────────────────────────

const newUserSchema = z.object({
    fullName: z.string().min(2, "Ingresa tu nombre completo."),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
})

const existingUserSchema = z.object({
    password: z.string().min(1, "Ingresa tu contraseña."),
})

type NewUserValues = z.infer<typeof newUserSchema>
type ExistingUserValues = z.infer<typeof existingUserSchema>

// ── Props ──────────────────────────────────────────────────────────────────────

interface InviteAcceptFormProps {
    token: string
    email: string
    role: string
    organizationName: string
    inviterName: string
}

const roleLabels: Record<string, string> = {
    OWNER: "Propietario",
    ADMIN: "Administrador",
    MEMBER: "Miembro",
    ACCOUNTANT: "Contador",
}

// ── Component ──────────────────────────────────────────────────────────────────

export function InviteAcceptForm({
    token, email, role, organizationName, inviterName,
}: InviteAcceptFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    // "new" = create account, "existing" = already have account → sign in
    const [mode, setMode] = useState<"new" | "existing">("new")

    // ── Form: new user ─────────────────────────────────────────────────────────
    const newForm = useForm<NewUserValues>({
        resolver: zodResolver(newUserSchema),
        defaultValues: { fullName: "", password: "" },
    })

    function onNewUserSubmit(values: NewUserValues) {
        startTransition(async () => {
            const res = await acceptInvite({ token, fullName: values.fullName, password: values.password })
            if (res?.error) {
                toast.error("No se pudo aceptar la invitación", { description: res.error })
            } else {
                toast.success("¡Bienvenido al equipo!")
                router.push("/dashboard")
            }
        })
    }

    // ── Form: existing user ────────────────────────────────────────────────────
    const existingForm = useForm<ExistingUserValues>({
        resolver: zodResolver(existingUserSchema),
        defaultValues: { password: "" },
    })

    function onExistingUserSubmit(values: ExistingUserValues) {
        startTransition(async () => {
            const res = await acceptInviteExistingUser({ token, email, password: values.password })
            if (res?.error) {
                toast.error("No se pudo aceptar la invitación", { description: res.error })
            } else {
                toast.success("¡Te uniste al equipo!")
                router.push("/dashboard")
            }
        })
    }

    // ── Shared info box ────────────────────────────────────────────────────────
    const InfoBox = () => (
        <div className="rounded-xl p-4 mb-5 space-y-2.5"
            style={{ background: '#f8faff', border: '1px solid #e0e7ff' }}>
            {/* Invitation message */}
            <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold text-indigo-700">{inviterName}</span>
                {" "}te ha invitado a unirte al equipo de{" "}
                <span className="font-semibold text-gray-900">{organizationName}</span>.
            </p>
            <div className="flex flex-wrap gap-3 pt-0.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0 text-indigo-400" />
                    <span className="truncate max-w-[160px]">{email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Shield className="w-3.5 h-3.5 flex-shrink-0 text-indigo-400" />
                    <span className="font-medium text-indigo-700">
                        {roleLabels[role] ?? role}
                    </span>
                </div>
            </div>
        </div>
    )

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)' }}>
                    <UserPlus className="w-6 h-6" style={{ color: '#6366f1' }} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Únete al equipo
                </h2>
                <p className="mt-1.5 text-sm text-gray-500">
                    {mode === "new"
                        ? "Crea tu cuenta para aceptar la invitación."
                        : "Inicia sesión para aceptar la invitación."}
                </p>
            </div>

            <InfoBox />

            {/* ── NEW USER FORM ─────────────────────────────────────────────── */}
            {mode === "new" && (
                <Form {...newForm}>
                    <form onSubmit={newForm.handleSubmit(onNewUserSubmit)} className="space-y-4" noValidate>
                        <FormField
                            control={newForm.control}
                            name="fullName"
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

                        <FormField
                            control={newForm.control}
                            name="password"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        Crea una contraseña
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Mínimo 6 caracteres"
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

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-10 mt-1 font-medium text-sm"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                        >
                            {isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Aceptando invitación...</>
                            ) : (
                                "Crear cuenta y unirme →"
                            )}
                        </Button>
                    </form>
                </Form>
            )}

            {/* ── EXISTING USER FORM ────────────────────────────────────────── */}
            {mode === "existing" && (
                <Form {...existingForm}>
                    <form onSubmit={existingForm.handleSubmit(onExistingUserSubmit)} className="space-y-4" noValidate>
                        <div className="space-y-1.5">
                            <p className="text-sm font-medium text-gray-700">Correo electrónico</p>
                            <div className="h-10 px-3 flex items-center rounded-md text-sm text-gray-500 border border-gray-200 bg-gray-50">
                                {email}
                            </div>
                        </div>

                        <FormField
                            control={existingForm.control}
                            name="password"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        Contraseña
                                    </FormLabel>
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

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-10 mt-1 font-medium text-sm"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                        >
                            {isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Aceptando invitación...</>
                            ) : (
                                "Iniciar sesión y unirme →"
                            )}
                        </Button>
                    </form>
                </Form>
            )}

            {/* ── MODE TOGGLE ───────────────────────────────────────────────── */}
            <div className="mt-5 text-center">
                {mode === "new" ? (
                    <p className="text-sm text-gray-500">
                        ¿Ya tienes cuenta?{" "}
                        <button
                            type="button"
                            onClick={() => setMode("existing")}
                            className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                            <LogIn className="w-3.5 h-3.5 inline mr-1" />
                            Inicia sesión aquí
                        </button>
                    </p>
                ) : (
                    <p className="text-sm text-gray-500">
                        ¿No tienes cuenta?{" "}
                        <button
                            type="button"
                            onClick={() => setMode("new")}
                            className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                            Créala gratis
                        </button>
                    </p>
                )}
            </div>
        </div>
    )
}
