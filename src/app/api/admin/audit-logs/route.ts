import { route, success } from "@/server/lib/http";
import { requireAdmin } from "@/server/auth/guards";
import { listAuditQuerySchema } from "@/server/validators/admin";
import { listAuditLogs } from "@/server/services/audit";

export const dynamic = "force-dynamic";

// GET /api/admin/audit-logs — admin only.
export const GET = route(async (req, requestId) => {
  await requireAdmin(req);
  const url = new URL(req.url);
  const filter = listAuditQuerySchema.parse({
    action: url.searchParams.get("action") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  const data = await listAuditLogs(filter);
  return success(data, { requestId });
});
