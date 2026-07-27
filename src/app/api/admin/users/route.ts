import { route, success } from "@/server/lib/http";
import { requireAdmin } from "@/server/auth/guards";
import { listUsersQuerySchema } from "@/server/validators/admin";
import { listUsers } from "@/server/services/admin-users";

export const dynamic = "force-dynamic";

// GET /api/admin/users — admin only.
export const GET = route(async (req, requestId) => {
  await requireAdmin(req);
  const url = new URL(req.url);
  const filter = listUsersQuerySchema.parse({
    role: url.searchParams.get("role") ?? undefined,
  });
  const data = await listUsers(filter);
  return success(data, { requestId });
});
