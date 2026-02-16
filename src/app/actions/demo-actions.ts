'use server';

import { db } from '@/db';
import { organizations } from '@/db/schema';
import { revalidatePath } from 'next/cache';

export async function createTestOrg() {
    await db.insert(organizations).values({
        name: `Empresa de Prueba ${new Date().toLocaleTimeString()}`,
        slug: `test-org-${Date.now()}`,
    });
    revalidatePath('/test-db');
}

export async function getTestOrgs() {
    return await db.query.organizations.findMany({
        columns: {
            id: true,
            name: true,
            slug: true,
        },
        orderBy: (organizations, { desc }) => [desc(organizations.createdAt)],
    });
}
