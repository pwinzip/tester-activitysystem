import { prisma } from "@/server/lib/prisma";

export async function listAssessmentAssignments() {
  return prisma.assessmentAssignment.findMany({
    orderBy: { testerCode: "asc" },
    include: {
      studentUser: { select: { email: true } },
      pendingUser: { select: { email: true } },
      staffUser: { select: { email: true } },
      activity: {
        select: {
          activityCode: true,
          title: true,
          status: true,
          qrToken: true,
        },
      },
    },
  });
}
