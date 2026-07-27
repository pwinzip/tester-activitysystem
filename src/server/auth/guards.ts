import { auth } from "./auth";
import { AppError } from "@/server/lib/errors";
import { prisma } from "@/server/lib/prisma";

export type SessionResult = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type RoleName = "STUDENT" | "STAFF" | "ADMIN";

/** The acting user's identity as needed by services. */
export interface Actor {
  id: string;
  role: RoleName;
}

export function toActor(session: SessionResult): Actor {
  return { id: session.user.id, role: session.user.role as RoleName };
}

/** Returns the Better Auth session or throws AUTH_REQUIRED. */
export async function requireSession(req: Request): Promise<SessionResult> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    throw new AppError("AUTH_REQUIRED", "Authentication required.");
  }
  return session;
}

/**
 * Requires a signed-in student whose email is verified and profile ACTIVE.
 * Enforced on the backend regardless of any frontend gating (spec §7, §NFR-06).
 */
export async function requireActiveStudent(req: Request) {
  const session = await requireSession(req);
  if (!session.user.emailVerified) {
    throw new AppError("EMAIL_NOT_VERIFIED", "Email is not verified.");
  }
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    throw new AppError("FORBIDDEN", "Student profile not found.");
  }
  if (profile.status === "SUSPENDED") {
    throw new AppError("USER_SUSPENDED", "This account is suspended.");
  }
  return { session, profile };
}

/**
 * Requires a signed-in STAFF or ADMIN. Backend-enforced authorization — never
 * rely on hidden frontend menus (spec §7, NFR-06/07).
 */
export async function requireStaffOrAdmin(req: Request): Promise<Actor> {
  const session = await requireSession(req);
  const role = session.user.role as RoleName;
  if (role !== "STAFF" && role !== "ADMIN") {
    throw new AppError("FORBIDDEN", "Staff or admin role required.");
  }
  return toActor(session);
}

/** Requires a signed-in ADMIN. */
export async function requireAdmin(req: Request): Promise<Actor> {
  const session = await requireSession(req);
  const role = session.user.role as RoleName;
  if (role !== "ADMIN") {
    throw new AppError("FORBIDDEN", "Admin role required.");
  }
  return toActor(session);
}
