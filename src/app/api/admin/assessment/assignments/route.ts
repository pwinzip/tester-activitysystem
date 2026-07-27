import { route, success } from "@/server/lib/http";
import { requireAdmin } from "@/server/auth/guards";
import { env } from "@/server/lib/env";
import { AppError } from "@/server/lib/errors";
import { listAssessmentAssignments } from "@/server/services/assessment";

export const dynamic = "force-dynamic";

// GET /api/admin/assessment/assignments — admin, assessment mode only.
export const GET = route(async (req, requestId) => {
  await requireAdmin(req);
  if (env.APP_MODE !== "assessment") {
    throw new AppError("FORBIDDEN", "Assessment mode is not enabled.");
  }
  const data = await listAssessmentAssignments();
  return success(data, { requestId });
});
