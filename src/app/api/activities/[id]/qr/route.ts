import { route, success } from "@/server/lib/http";
import { requireStaffOrAdmin } from "@/server/auth/guards";
import { getActivityQr } from "@/server/services/activity";

export const dynamic = "force-dynamic";

// GET /api/activities/:id/qr — staff/admin; returns token + check-in URL.
export const GET = route(async (req, requestId, ctx) => {
  const actor = await requireStaffOrAdmin(req);
  const { id } = await ctx.params!;
  const data = await getActivityQr(actor, id);
  return success(data, { requestId });
});
