import { prisma } from "@/server/lib/prisma";
import { env } from "@/server/lib/env";
import { AppError } from "@/server/lib/errors";
import { logger } from "@/server/lib/logger";
import { generateActivityCode, generateQrToken } from "@/server/lib/ids";
import {
  evaluateActivityTransition,
  type ActivityStatusName,
} from "@/server/services/activity-transition";
import type { Actor } from "@/server/auth/guards";
import type {
  CreateActivityInput,
  UpdateActivityInput,
} from "@/server/validators/activity";

// Summary fields exposed in lists/details (never leaks qrToken).
const summarySelect = {
  id: true,
  activityCode: true,
  title: true,
  description: true,
  activityDate: true,
  startTime: true,
  endTime: true,
  location: true,
  status: true,
  ownerGroupCode: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function uniqueActivityCode(): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateActivityCode();
    const existing = await prisma.activity.findUnique({
      where: { activityCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new AppError(
    "INTERNAL_SERVER_ERROR",
    "Could not allocate a unique activity code.",
  );
}

export async function createActivity(actor: Actor, input: CreateActivityInput) {
  const activityCode = await uniqueActivityCode();
  const qrToken = generateQrToken();

  const activity = await prisma.activity.create({
    data: {
      activityCode,
      qrToken,
      title: input.title,
      description: input.description,
      activityDate: input.activityDate,
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location,
      status: "DRAFT",
      createdById: actor.id,
    },
    select: summarySelect,
  });

  logger.info("activity_created", { activityId: activity.id, actor: actor.id });
  return activity;
}

export async function listActivities(
  actor: Actor,
  filter: { status?: ActivityStatusName },
) {
  // Students only ever see OPEN activities.
  const where =
    actor.role === "STUDENT"
      ? { status: "OPEN" as ActivityStatusName }
      : filter.status
        ? { status: filter.status }
        : {};

  return prisma.activity.findMany({
    where,
    orderBy: { activityDate: "desc" },
    select: summarySelect,
  });
}

export async function getActivity(actor: Actor, id: string) {
  const activity = await prisma.activity.findUnique({
    where: { id },
    select: summarySelect,
  });
  if (!activity) {
    throw new AppError("ACTIVITY_NOT_FOUND", "Activity not found.");
  }
  // Hide non-open activities from students entirely.
  if (actor.role === "STUDENT" && activity.status !== "OPEN") {
    throw new AppError("ACTIVITY_NOT_FOUND", "Activity not found.");
  }
  return activity;
}

export async function updateActivity(
  _actor: Actor,
  id: string,
  input: UpdateActivityInput,
) {
  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity) {
    throw new AppError("ACTIVITY_NOT_FOUND", "Activity not found.");
  }
  if (activity.status === "CLOSED" || activity.status === "CANCELLED") {
    throw new AppError(
      "INVALID_ACTIVITY_TRANSITION",
      "A closed or cancelled activity cannot be edited.",
    );
  }

  const startTime = input.startTime ?? activity.startTime;
  const endTime = input.endTime ?? activity.endTime;
  if (endTime.getTime() <= startTime.getTime()) {
    throw new AppError("VALIDATION_ERROR", "Invalid time range.", [
      { field: "endTime", message: "endTime must be after startTime" },
    ]);
  }

  const updated = await prisma.activity.update({
    where: { id },
    data: input,
    select: summarySelect,
  });
  logger.info("activity_updated", { activityId: id });
  return updated;
}

export async function changeActivityStatus(
  actor: Actor,
  id: string,
  nextStatus: ActivityStatusName,
) {
  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity) {
    throw new AppError("ACTIVITY_NOT_FOUND", "Activity not found.");
  }

  const result = evaluateActivityTransition({
    role: actor.role,
    currentStatus: activity.status as ActivityStatusName,
    nextStatus,
    startTime: activity.startTime,
    endTime: activity.endTime,
  });

  switch (result) {
    case "STATUS_CHANGE_ALLOWED": {
      const updated = await prisma.activity.update({
        where: { id },
        data: { status: nextStatus },
        select: summarySelect,
      });
      logger.info("activity_status_changed", {
        activityId: id,
        from: activity.status,
        to: nextStatus,
        actor: actor.id,
      });
      return updated;
    }
    case "ROLE_NOT_ALLOWED":
      throw new AppError("FORBIDDEN", "You may not change activity status.");
    case "INVALID_TIME_RANGE":
      throw new AppError("VALIDATION_ERROR", "Invalid activity time range.", [
        { field: "endTime", message: "endTime must be after startTime" },
      ]);
    case "INVALID_TRANSITION":
      throw new AppError(
        "INVALID_ACTIVITY_TRANSITION",
        `Cannot change status from ${activity.status} to ${nextStatus}.`,
      );
  }
}

export async function getActivityQr(_actor: Actor, id: string) {
  const activity = await prisma.activity.findUnique({
    where: { id },
    select: {
      id: true,
      activityCode: true,
      title: true,
      status: true,
      qrToken: true,
      qrExpiresAt: true,
    },
  });
  if (!activity) {
    throw new AppError("ACTIVITY_NOT_FOUND", "Activity not found.");
  }
  return {
    activityId: activity.id,
    activityCode: activity.activityCode,
    title: activity.title,
    status: activity.status,
    qrToken: activity.qrToken,
    qrExpiresAt: activity.qrExpiresAt,
    checkinUrl: `${env.PUBLIC_APP_URL}/checkin/${activity.qrToken}`,
  };
}
