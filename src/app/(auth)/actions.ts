'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email('Correo electrónico inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

const signupSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Correo electrónico inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    isAccountant: z.boolean().default(false),
    refId: z.string().optional(),
})

export async function login(data: z.infer<typeof loginSchema>) {
    const supabase = await createClient()

    const parsed = loginSchema.safeParse(data)
    if (!parsed.success) {
        return { error: 'Datos inválidos' }
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
    })

    if (error) {
        return { error: 'Credenciales inválidas o correo no registrado' }
    }

    revalidatePath('/', 'layout')

    // Verificar si es contador
    if (authData.user?.user_metadata?.is_accountant) {
        redirect('/accountant')
    } else {
        redirect('/dashboard')
    }
}

export async function signup(data: z.infer<typeof signupSchema>) {
    const supabase = await createClient()

    const parsed = signupSchema.safeParse(data)
    if (!parsed.success) {
        return { error: 'Datos inválidos' }
    }

    const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
            data: {
                full_name: parsed.data.name,
                is_accountant: parsed.data.isAccountant,
                invited_by_ref: parsed.data.refId,
            }
        }
    })

    if (error) {
        return { error: error.message || 'Error al crear la cuenta' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function signOutAction() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}
