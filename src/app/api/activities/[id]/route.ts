import { route, readJson, success, getClientMeta } from "@/server/lib/http";
import { requireSession, requireStaffOrAdmin, toActor } from "@/server/auth/guards";
import { updateActivitySchema } from "@/server/validators/activity";
import { getActivity, updateActivity } from "@/server/services/activity";
import { recordAudit } from "@/server/services/audit";

export const dynamic = "force-dynamic";

// GET /api/activities/:id — role/scope based.
export const GET = route(async (req, requestId, ctx) => {
  const session = await requireSession(req);
  const { id } = await ctx.params!;
  const data = await getActivity(toActor(session), id);
  return success(data, { requestId });
});

// PATCH /api/activities/:id — staff/admin only.
export const PATCH = route(async (req, requestId, ctx) => {
  const actor = await requireStaffOrAdmin(req);
  const { id } = await ctx.params!;
  const body = await readJson(req);
  const input = updateActivitySchema.parse(body);
  const data = await updateActivity(actor, id, input);
  await recordAudit({
    actorUserId: actor.id,
    action: "ACTIVITY_UPDATED",
    entityType: "Activity",
    entityId: id,
    metadata: { fields: Object.keys(input) },
    requestId,
    ...getClientMeta(req),
  });
  return success(data, { requestId });
});
