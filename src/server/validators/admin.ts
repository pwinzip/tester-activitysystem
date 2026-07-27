import { z } from "zod";

export const listUsersQuerySchema = z.object({
  role: z.enum(["STUDENT", "STAFF", "ADMIN"]).optional(),
});

export const updateUserStatusSchema = z.object({
  // Admin may activate or suspend; PENDING is only reachable via the OTP flow.
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["STUDENT", "STAFF", "ADMIN"]),
});

export const listAuditQuerySchema = z.object({
  action: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
