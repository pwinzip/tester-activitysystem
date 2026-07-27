import { Prisma } from "@prisma/client";
import { prisma } from "@/server/lib/prisma";
import { logger } from "@/server/lib/logger";

export interface AuditInput {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Records an audit event (spec FR-23, NFR-19). Never throws — an audit failure
 * must not break the underlying action; it is logged instead.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        requestId: input.requestId ?? null,
        metadata: (input.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (err) {
    logger.error("audit_write_failed", {
      action: input.action,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function listAuditLogs(filter: {
  action?: string;
  limit: number;
}) {
  return prisma.auditLog.findMany({
    where: filter.action ? { action: filter.action } : {},
    orderBy: { createdAt: "desc" },
    take: filter.limit,
    include: {
      actorUser: { select: { id: true, email: true, name: true, role: true } },
    },
  });
}
