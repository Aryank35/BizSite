import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export type AuditEvent = {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  businessId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

type Db = Pick<typeof prisma, "auditLog">;

export async function recordAudit(event: AuditEvent, db: Db = prisma): Promise<void> {
  await db.auditLog.create({
    data: {
      actorId: event.actorId,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId ?? null,
      businessId: event.businessId ?? null,
      metadata: event.metadata,
    },
  });
}
