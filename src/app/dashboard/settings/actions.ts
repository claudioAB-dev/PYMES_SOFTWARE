'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/db' // Assuming db is exported from '@/db' or similar
import { organizations, memberships, satCredentials } from '@/db/schema' // Add memberships import
import { encryptText } from '@/lib/security/encryption'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updateOrgSchema = z.object({
    organizationId: z.string().uuid(),
    address: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().optional().or(z.literal('')),
    taxId: z.string().optional(),
})

export async function uploadLogo(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const file = formData.get('file') as File
    const organizationId = formData.get('organizationId') as string

    if (!file || !organizationId) {
        return { error: 'Missing file or organization ID' }
    }

    // Check if user is a member of the organization
    // We need to query the memberships table.
    // Assuming we have access to db here. If not, we might need to rely on RLS if configured seamlessly, 
    // but for business logic, let's verify membership explicitly or via a helper.
    // For now, I'll do a quick check.

    // Check membership
    const membership = await db.query.memberships.findFirst({
        where: and(
            eq(memberships.userId, user.id),
            eq(memberships.organizationId, organizationId)
        )
    })

    if (!membership) {
        return { error: 'Forbidden: You are not a member of this organization' }
    }

    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
        return { error: 'Forbidden: Only Admins can update settings' }
    }


    if (file.size > 2 * 1024 * 1024) {
        return { error: 'File size must be less than 2MB' }
    }

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
        return { error: 'Invalid file type. Only PNG and JPEG are allowed.' }
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${organizationId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
        .from('organizations')
        .upload(fileName, file)

    if (uploadError) {
        console.error('Upload error:', uploadError)
        return { error: 'Failed to upload logo' }
    }

    const { data: { publicUrl } } = supabase.storage
        .from('organizations')
        .getPublicUrl(fileName)

    await db.update(organizations)
        .set({ logoUrl: publicUrl })
        .where(eq(organizations.id, organizationId))

    revalidatePath('/dashboard/settings')

    return { success: true, url: publicUrl }
}

export async function updateOrganization(input: z.infer<typeof updateOrgSchema>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { organizationId, address, phone, website, taxId } = input

    // Check membership
    const membership = await db.query.memberships.findFirst({
        where: and(
            eq(memberships.userId, user.id),
            eq(memberships.organizationId, organizationId)
        )
    })

    if (!membership) {
        return { error: 'Forbidden: You are not a member of this organization' }
    }

    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
        return { error: 'Forbidden: Only Admins can update settings' }
    }

    try {
        await db.update(organizations)
            .set({
                address,
                phone,
                website,
                taxId,
                updatedAt: new Date(),
            })
            .where(eq(organizations.id, organizationId))

        revalidatePath('/dashboard/settings')
        return { success: true }
    } catch (error) {
        console.error('Update error:', error)
        return { error: 'Failed to update organization' }
    }
}

export async function uploadCSD(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const organizationId = formData.get('organizationId') as string
    const rfc = formData.get('rfc') as string
    const password = formData.get('password') as string
    const cerFile = formData.get('cerFile') as File
    const keyFile = formData.get('keyFile') as File

    if (!organizationId || !rfc || !password || !cerFile || !keyFile) {
        return { error: 'Missing required fields' }
    }

    // Check membership
    const membership = await db.query.memberships.findFirst({
        where: and(
            eq(memberships.userId, user.id),
            eq(memberships.organizationId, organizationId)
        )
    })

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
        return { error: 'Forbidden: You do not have permission to manage CSDs' }
    }

    try {
        const cerArrayBuffer = await cerFile.arrayBuffer()
        const keyArrayBuffer = await keyFile.arrayBuffer()

        const cerBase64 = Buffer.from(cerArrayBuffer).toString('base64')
        const keyBase64 = Buffer.from(keyArrayBuffer).toString('base64')

        const { encryptedText, ivHex } = encryptText(password)

        await db.insert(satCredentials)
            .values({
                organizationId,
                rfc,
                cerBase64,
                keyBase64,
                encryptedPassword: encryptedText,
                iv: ivHex,
            })
            .onConflictDoUpdate({
                target: satCredentials.organizationId,
                set: {
                    rfc,
                    cerBase64,
                    keyBase64,
                    encryptedPassword: encryptedText,
                    iv: ivHex,
                    updatedAt: new Date(),
                }
            })

        revalidatePath('/dashboard/settings')
        return { success: true }
    } catch (error) {
        console.error('CSD upload error:', error)
        return { error: 'Failed to process and store CSD' }
    }
}
