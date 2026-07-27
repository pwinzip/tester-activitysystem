import { route } from "@/server/lib/http";
import { requireStaffOrAdmin } from "@/server/auth/guards";
import { buildParticipantsCsv } from "@/server/services/attendance";

export const dynamic = "force-dynamic";

// GET /api/activities/:id/export.csv — staff/admin CSV download.
export const GET = route(async (req, requestId, ctx) => {
  const actor = await requireStaffOrAdmin(req);
  const { id } = await ctx.params!;
  const { filename, csv } = await buildParticipantsCsv(actor, id);
  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "x-request-id": requestId,
    },
  });
});
