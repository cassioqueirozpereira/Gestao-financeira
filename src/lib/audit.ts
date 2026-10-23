import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

interface AuditLogParams {
  userId?: string | null;
  action: "CREATE" | "UPDATE" | "DELETE" | "VOID" | "STATUS_CHANGE" | "RECONCILE";
  entity: string;
  entityId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  description?: string | null;
}

/**
 * Registra formalmente uma ação no histórico de auditoria do sistema
 */
export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  oldValues,
  newValues,
  ipAddress,
  description,
}: AuditLogParams) {
  try {
    return await db.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId,
        oldValues: oldValues ? (oldValues as Prisma.InputJsonValue) : Prisma.JsonNull,
        newValues: newValues ? (newValues as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress: ipAddress || null,
        description: description || null,
      },
    });
  } catch (error) {
    console.error("Erro ao registrar log de auditoria:", error);
    // Não interrompe o fluxo principal, mas alerta no console
    return null;
  }
}
