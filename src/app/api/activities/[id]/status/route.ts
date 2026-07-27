import { route, readJson, success, getClientMeta } from "@/server/lib/http";
import { requireStaffOrAdmin } from "@/server/auth/guards";
import { changeStatusSchema } from "@/server/validators/activity";
import { changeActivityStatus } from "@/server/services/activity";
import { recordAudit } from "@/server/services/audit";

export const dynamic = "force-dynamic";

// PATCH /api/activities/:id/status — staff/admin; enforces state machine.
export const PATCH = route(async (req, requestId, ctx) => {
  const actor = await requireStaffOrAdmin(req);
  const { id } = await ctx.params!;
  const body = await readJson(req);
  const { status } = changeStatusSchema.parse(body);
  const data = await changeActivityStatus(actor, id, status);
  await recordAudit({
    actorUserId: actor.id,
    action: "ACTIVITY_STATUS_CHANGED",
    entityType: "Activity",
    entityId: id,
    metadata: { status },
    requestId,
    ...getClientMeta(req),
  });
  return success(data, { requestId });
});
