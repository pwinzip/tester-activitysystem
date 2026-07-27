import { route, success, getClientMeta } from "@/server/lib/http";
import { requireActiveStudent, requireSession } from "@/server/auth/guards";
import { getCheckinSummary, checkIn } from "@/server/services/attendance";

export const dynamic = "force-dynamic";

// GET /api/checkin/:token — activity summary for the confirmation page.
export const GET = route(async (req, requestId, ctx) => {
  const session = await requireSession(req);
  const { token } = await ctx.params!;
  const data = await getCheckinSummary(session, token);
  return success(data, { requestId });
});

// POST /api/checkin/:token — authenticated active student records attendance.
export const POST = route(async (req, requestId, ctx) => {
  const { session } = await requireActiveStudent(req);
  const { token } = await ctx.params!;
  const { ipAddress, userAgent } = getClientMeta(req);
  const data = await checkIn(session, token, { ipAddress, userAgent, requestId });
  return success(data, { status: 201, requestId });
});
