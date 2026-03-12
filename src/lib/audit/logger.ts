import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export type AuditLogData = {
  organizationId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
};

export async function logAuditTransaction(data: AuditLogData) {
  try {
    await db.insert(auditLogs).values({
      organizationId: data.organizationId,
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId ?? null,
      oldValues: data.oldValues ?? null,
      newValues: data.newValues ?? null,
      ipAddress: data.ipAddress ?? null,
    });
  } catch (error) {
    console.error("[AUDIT LOG ERROR] Failed to insert audit log:", error);
    // Function fails silently so it doesn't break the main app
  }
}
