'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { memberships, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getUserProfile() {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { error: 'No autorizado' }
    }

    try {
        // Fetch user basic data
        const dbUser = await db.query.users.findFirst({
            where: eq(users.id, user.id)
        })

        if (!dbUser) {
            return { error: 'Usuario no encontrado en la base de datos' }
        }

        // Fetch memberships with organizations included
        const userMemberships = await db.query.memberships.findMany({
            where: eq(memberships.userId, user.id),
            with: {
                organization: true
            }
        })

        return {
            success: true,
            user: dbUser,
            memberships: userMemberships
        }
    } catch (error) {
        console.error('Error fetching user profile:', error)
        return { error: 'Error al cargar el perfil de usuario' }
    }
}

export async function updateProfile(data: { fullName: string; avatarUrl?: string | null }) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { error: 'No autorizado' }
    }

    try {
        await db.update(users)
            .set({
                fullName: data.fullName,
                avatarUrl: data.avatarUrl,
                updatedAt: new Date(),
            })
            .where(eq(users.id, user.id))

        revalidatePath('/dashboard/(config)/profile', 'layout')
        revalidatePath('/dashboard', 'layout') // to update any potential header/sidebar

        return { success: true }
    } catch (error) {
        console.error('Error updating profile:', error)
        return { error: 'Error al actualizar el perfil' }
    }
}

export async function updatePassword(password: string) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { error: 'No autorizado' }
    }

    try {
        const { error: updateError } = await supabase.auth.updateUser({
            password: password
        })

        if (updateError) {
            console.error('Supabase password update error:', updateError)
            return { error: updateError.message }
        }

        return { success: true }
    } catch (error) {
        console.error('Error updating password:', error)
        return { error: 'Error al actualizar la contraseña' }
    }
}
