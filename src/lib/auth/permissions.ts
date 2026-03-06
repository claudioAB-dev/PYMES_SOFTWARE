import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { memberships, customRoles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { type PermissionId } from "@/lib/validators/team";

export async function getUserPermissions(organizationId: string): Promise<string[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const membership = await db.select({
        role: memberships.role,
        permissions: customRoles.permissions,
    })
        .from(memberships)
        .leftJoin(customRoles, eq(memberships.customRoleId, customRoles.id))
        .where(
            and(
                eq(memberships.userId, user.id),
                eq(memberships.organizationId, organizationId)
            )
        )
        .limit(1);

    if (membership.length === 0) {
        return [];
    }

    const currentMembership = membership[0];

    if (currentMembership.role === 'OWNER' || currentMembership.role === 'ADMIN') {
        return ['*'];
    }

    if (currentMembership.permissions) {
        return currentMembership.permissions as string[];
    }

    return [];
}

export async function requirePermission(permissionId: PermissionId, organizationId: string) {
    const permissions = await getUserPermissions(organizationId);

    if (!permissions.includes('*') && !permissions.includes(permissionId)) {
        redirect('/dashboard');
    }
}
