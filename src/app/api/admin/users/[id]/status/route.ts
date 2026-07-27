import { route, readJson, success, getClientMeta } from "@/server/lib/http";
import { requireAdmin } from "@/server/auth/guards";
import { updateUserStatusSchema } from "@/server/validators/admin";
import { updateUserStatus } from "@/server/services/admin-users";
import { recordAudit } from "@/server/services/audit";

export const dynamic = "force-dynamic";

// PATCH /api/admin/users/:id/status — admin only.
export const PATCH = route(async (req, requestId, ctx) => {
  const admin = await requireAdmin(req);
  const { id } = await ctx.params!;
  const { status } = updateUserStatusSchema.parse(await readJson(req));
  const data = await updateUserStatus(admin, id, status);
  await recordAudit({
    actorUserId: admin.id,
    action: "USER_STATUS_CHANGED",
    entityType: "User",
    entityId: id,
    metadata: { status },
    requestId,
    ...getClientMeta(req),
  });
  return success(data, { requestId });
});
