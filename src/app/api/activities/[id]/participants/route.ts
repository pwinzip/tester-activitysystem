import { route, success } from "@/server/lib/http";
import { requireStaffOrAdmin } from "@/server/auth/guards";
import { listParticipants } from "@/server/services/attendance";

export const dynamic = "force-dynamic";

// GET /api/activities/:id/participants — staff/admin, owner/scope enforced.
export const GET = route(async (req, requestId, ctx) => {
  const actor = await requireStaffOrAdmin(req);
  const { id } = await ctx.params!;
  const data = await listParticipants(actor, id);
  return success(data, { requestId });
});
