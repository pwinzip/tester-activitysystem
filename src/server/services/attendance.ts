import { prisma } from "@/server/lib/prisma";
import { AppError, type ErrorCode } from "@/server/lib/errors";
import { logger } from "@/server/lib/logger";
import { qrTokenFingerprint } from "@/server/lib/ids";
import { canCheckIn, type CheckInResult } from "@/server/services/checkin";
import {
  canViewAttendanceReport,
  type ReportAccessResult,
} from "@/server/services/report-access";
import type { Actor, SessionResult } from "@/server/auth/guards";

export interface RequestMeta {
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string;
}

// Map the pure check-in result to the HTTP error contract (spec §16).
const CHECKIN_ERROR: Record<Exclude<CheckInResult, "CHECKIN_ALLOWED">, ErrorCode> =
  {
    AUTH_REQUIRED: "AUTH_REQUIRED",
    EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
    STUDENT_NOT_ACTIVE: "USER_SUSPENDED",
    INVALID_QR: "INVALID_QR",
    ACTIVITY_NOT_OPEN: "ACTIVITY_NOT_OPEN",
    OUTSIDE_CHECKIN_TIME: "OUTSIDE_CHECKIN_TIME",
    DUPLICATE_CHECKIN: "DUPLICATE_CHECKIN",
  };

const CHECKIN_MESSAGE: Record<CheckInResult, string> = {
  AUTH_REQUIRED: "Please sign in to check in.",
  EMAIL_NOT_VERIFIED: "Please verify your email before checking in.",
  STUDENT_NOT_ACTIVE: "Your account is not active.",
  INVALID_QR: "This QR code is not valid.",
  ACTIVITY_NOT_OPEN: "This activity is not open for check-in.",
  OUTSIDE_CHECKIN_TIME: "Check-in is outside the allowed time window.",
  DUPLICATE_CHECKIN: "You have already checked in to this activity.",
  CHECKIN_ALLOWED: "Check-in allowed.",
};

function isWithinWindow(start: Date, end: Date, now: Date): boolean {
  return now.getTime() >= start.getTime() && now.getTime() <= end.getTime();
}

/** Loads a public-safe activity summary for the check-in confirmation page. */
export async function getCheckinSummary(session: SessionResult, token: string) {
  const activity = await prisma.activity.findUnique({
    where: { qrToken: token },
    select: {
      id: true,
      activityCode: true,
      title: true,
      description: true,
      activityDate: true,
      startTime: true,
      endTime: true,
      location: true,
      status: true,
    },
  });
  if (!activity) {
    throw new AppError("INVALID_QR", "This QR code is not valid.");
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const alreadyCheckedIn = profile
    ? Boolean(
        await prisma.attendance.findUnique({
          where: {
            activityId_studentProfileId: {
              activityId: activity.id,
              studentProfileId: profile.id,
            },
          },
          select: { id: true },
        }),
      )
    : false;

  return { activity, alreadyCheckedIn };
}

/**
 * Records a check-in. Runs the pure decision, logs every attempt (accepted or
 * not), and relies on the DB unique constraint as the final duplicate guard
 * (spec FR-17, NFR-09).
 */
export async function checkIn(
  session: SessionResult,
  token: string,
  meta: RequestMeta,
) {
  const activity = await prisma.activity.findUnique({
    where: { qrToken: token },
  });
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });

  const now = new Date();
  const alreadyCheckedIn =
    activity && profile
      ? Boolean(
          await prisma.attendance.findUnique({
            where: {
              activityId_studentProfileId: {
                activityId: activity.id,
                studentProfileId: profile.id,
              },
            },
            select: { id: true },
          }),
        )
      : false;

  const decision = canCheckIn({
    isAuthenticated: true,
    isEmailVerified: session.user.emailVerified,
    studentStatus: profile?.status ?? "PENDING_EMAIL_VERIFICATION",
    isValidQR: Boolean(activity),
    activityStatus: activity?.status ?? "DRAFT",
    isWithinTime: activity
      ? isWithinWindow(activity.startTime, activity.endTime, now)
      : false,
    alreadyCheckedIn,
  });

  async function logAttempt(resultCode: CheckInResult, accepted: boolean) {
    await prisma.checkinAttempt.create({
      data: {
        activityId: activity?.id ?? null,
        studentProfileId: profile?.id ?? null,
        qrTokenFingerprint: qrTokenFingerprint(token),
        resultCode,
        accepted,
        requestId: meta.requestId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
  }

  if (decision !== "CHECKIN_ALLOWED") {
    await logAttempt(decision, false);
    throw new AppError(CHECKIN_ERROR[decision], CHECKIN_MESSAGE[decision]);
  }

  // decision === CHECKIN_ALLOWED implies activity and profile exist.
  try {
    const attendance = await prisma.attendance.create({
      data: {
        activityId: activity!.id,
        studentProfileId: profile!.id,
        checkinTime: now,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
      select: { id: true, checkinTime: true },
    });
    await logAttempt("CHECKIN_ALLOWED", true);
    logger.info("checkin_recorded", {
      activityId: activity!.id,
      studentProfileId: profile!.id,
      requestId: meta.requestId,
    });
    return {
      checkedIn: true,
      attendanceId: attendance.id,
      checkinTime: attendance.checkinTime,
      activity: {
        activityCode: activity!.activityCode,
        title: activity!.title,
        location: activity!.location,
      },
    };
  } catch (err) {
    // Unique-constraint race → duplicate.
    if ((err as { code?: string })?.code === "P2002") {
      await logAttempt("DUPLICATE_CHECKIN", false);
      throw new AppError(
        "DUPLICATE_CHECKIN",
        CHECKIN_MESSAGE.DUPLICATE_CHECKIN,
      );
    }
    throw err;
  }
}

const REPORT_ERROR: Record<
  Exclude<ReportAccessResult, "REPORT_ACCESS_ALLOWED">,
  ErrorCode
> = {
  AUTH_REQUIRED: "AUTH_REQUIRED",
  ROLE_NOT_ALLOWED: "FORBIDDEN",
  NOT_ACTIVITY_OWNER: "FORBIDDEN",
};

async function authorizeReport(actor: Actor, activityId: string) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });
  if (!activity) {
    throw new AppError("ACTIVITY_NOT_FOUND", "Activity not found.");
  }
  const decision = canViewAttendanceReport({
    isAuthenticated: true,
    role: actor.role,
    isActivityOwnerOrInScope: activity.createdById === actor.id,
  });
  if (decision !== "REPORT_ACCESS_ALLOWED") {
    throw new AppError(
      REPORT_ERROR[decision],
      "You may not view this attendance report.",
    );
  }
  return activity;
}

export async function listParticipants(actor: Actor, activityId: string) {
  const activity = await authorizeReport(actor, activityId);
  const participants = await prisma.attendance.findMany({
    where: { activityId },
    orderBy: { checkinTime: "asc" },
    select: {
      id: true,
      checkinTime: true,
      studentProfile: {
        select: { studentId: true, fullName: true, major: true, yearLevel: true },
      },
    },
  });
  return {
    activity: {
      id: activity.id,
      activityCode: activity.activityCode,
      title: activity.title,
      status: activity.status,
    },
    total: participants.length,
    participants,
  };
}

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function buildParticipantsCsv(actor: Actor, activityId: string) {
  const activity = await authorizeReport(actor, activityId);
  const rows = await prisma.attendance.findMany({
    where: { activityId },
    orderBy: { checkinTime: "asc" },
    select: {
      checkinTime: true,
      studentProfile: {
        select: { studentId: true, fullName: true, major: true, yearLevel: true },
      },
    },
  });

  const header = [
    "studentId",
    "fullName",
    "major",
    "yearLevel",
    "checkinTime",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        csvCell(r.studentProfile.studentId),
        csvCell(r.studentProfile.fullName),
        csvCell(r.studentProfile.major),
        csvCell(r.studentProfile.yearLevel),
        csvCell(r.checkinTime.toISOString()),
      ].join(","),
    );
  }
  return {
    filename: `attendance-${activity.activityCode}.csv`,
    csv: lines.join("\r\n"),
  };
}
