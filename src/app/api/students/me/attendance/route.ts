import { route, success } from "@/server/lib/http";
import { requireActiveStudent } from "@/server/auth/guards";
import { prisma } from "@/server/lib/prisma";

export const dynamic = "force-dynamic";

// A student may view only their own attendance history (spec FR-21).
export const GET = route(async (req, requestId) => {
  const { profile } = await requireActiveStudent(req);
  const attendances = await prisma.attendance.findMany({
    where: { studentProfileId: profile.id },
    orderBy: { checkinTime: "desc" },
    include: {
      activity: {
        select: {
          activityCode: true,
          title: true,
          activityDate: true,
          location: true,
        },
      },
    },
  });
  return success(attendances, { requestId });
});
