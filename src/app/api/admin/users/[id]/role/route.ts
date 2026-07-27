import { route, readJson, success, getClientMeta } from "@/server/lib/http";
import { requireAdmin } from "@/server/auth/guards";
import { updateUserRoleSchema } from "@/server/validators/admin";
import { updateUserRole } from "@/server/services/admin-users";
import { recordAudit } from "@/server/services/audit";

export const dynamic = "force-dynamic";

// PATCH /api/admin/users/:id/role — admin only.
export const PATCH = route(async (req, requestId, ctx) => {
  const admin = await requireAdmin(req);
  const { id } = await ctx.params!;
  const { role } = updateUserRoleSchema.parse(await readJson(req));
  const data = await updateUserRole(admin, id, role);
  await recordAudit({
    actorUserId: admin.id,
    action: "USER_ROLE_CHANGED",
    entityType: "User",
    entityId: id,
    metadata: { role },
    requestId,
    ...getClientMeta(req),
  });
  return success(data, { requestId });
});
