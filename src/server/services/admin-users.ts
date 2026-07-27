import { prisma } from "@/server/lib/prisma";
import { AppError } from "@/server/lib/errors";
import { logger } from "@/server/lib/logger";
import type { Actor, RoleName } from "@/server/auth/guards";

type StudentStatusName = "PENDING_EMAIL_VERIFICATION" | "ACTIVE" | "SUSPENDED";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  emailVerified: true,
  isAssessmentAccount: true,
  createdAt: true,
  studentProfile: {
    select: {
      studentId: true,
      status: true,
      major: true,
      yearLevel: true,
    },
  },
} as const;

export async function listUsers(filter: { role?: RoleName }) {
  return prisma.user.findMany({
    where: filter.role ? { role: filter.role } : {},
    orderBy: { createdAt: "desc" },
    select: userSelect,
  });
}

/**
 * Sets a student account's status. Suspending also revokes active sessions so
 * the change takes effect immediately (spec FR-22).
 */
export async function updateUserStatus(
  _admin: Actor,
  userId: string,
  status: Extract<StudentStatusName, "ACTIVE" | "SUSPENDED">,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { studentProfile: true },
  });
  if (!user) {
    throw new AppError("USER_NOT_FOUND", "User not found.");
  }
  if (!user.studentProfile) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Only student accounts have a status.",
    );
  }

  const [, updated] = await prisma.$transaction([
    prisma.studentProfile.update({
      where: { userId },
      data: { status },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: userSelect }),
    // Revoke sessions when suspending.
    ...(status === "SUSPENDED"
      ? [prisma.session.deleteMany({ where: { userId } })]
      : []),
  ]);

  logger.info("user_status_updated", { userId, status });
  return updated;
}

/** Changes a user's role. Admins cannot change their own role (anti-lockout). */
export async function updateUserRole(
  admin: Actor,
  userId: string,
  role: RoleName,
) {
  if (userId === admin.id) {
    throw new AppError("FORBIDDEN", "You cannot change your own role.");
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("USER_NOT_FOUND", "User not found.");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: userSelect,
  });
  logger.info("user_role_updated", { userId, role });
  return updated;
}
