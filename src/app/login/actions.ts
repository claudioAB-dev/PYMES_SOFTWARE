'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const authSchema = z.object({
    email: z.string().email('Correo electrónico inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export async function login(data: z.infer<typeof authSchema>) {
    const supabase = await createClient()

    const parsed = authSchema.safeParse(data)
    if (!parsed.success) {
        return { error: 'Datos inválidos' }
    }

    const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
    })

    if (error) {
        return { error: 'Credenciales inválidas o correo no registrado' }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(data: z.infer<typeof authSchema>) {
    const supabase = await createClient()

    const parsed = authSchema.safeParse(data)
    if (!parsed.success) {
        return { error: 'Datos inválidos' }
    }

    const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
    })

    if (error) {
        return { error: error.message || 'Error al crear la cuenta' }
    }

    revalidatePath('/', 'layout')
    redirect('/onboarding')
}

export async function signOutAction() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}
