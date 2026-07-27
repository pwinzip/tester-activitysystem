import { route, readJson, success, getClientMeta } from "@/server/lib/http";
import { requireSession, requireStaffOrAdmin, toActor } from "@/server/auth/guards";
import {
  createActivitySchema,
  listActivitiesQuerySchema,
} from "@/server/validators/activity";
import { createActivity, listActivities } from "@/server/services/activity";
import { recordAudit } from "@/server/services/audit";

export const dynamic = "force-dynamic";

// GET /api/activities — authenticated; students see OPEN only.
export const GET = route(async (req, requestId) => {
  const session = await requireSession(req);
  const url = new URL(req.url);
  const filter = listActivitiesQuerySchema.parse({
    status: url.searchParams.get("status") ?? undefined,
  });
  const data = await listActivities(toActor(session), filter);
  return success(data, { requestId });
});

// POST /api/activities — staff/admin only.
export const POST = route(async (req, requestId) => {
  const actor = await requireStaffOrAdmin(req);
  const body = await readJson(req);
  const input = createActivitySchema.parse(body);
  const data = await createActivity(actor, input);
  await recordAudit({
    actorUserId: actor.id,
    action: "ACTIVITY_CREATED",
    entityType: "Activity",
    entityId: data.id,
    metadata: { activityCode: data.activityCode },
    requestId,
    ...getClientMeta(req),
  });
  return success(data, { status: 201, requestId });
});
