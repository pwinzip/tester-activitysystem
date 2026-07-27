// Shared helpers for assessment CLI scripts (run via tsx, standalone from the
// app). Self-contained — no "@/" path aliases — so tsx resolves cleanly.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import type { AssessmentTrackKey, AssessmentTesterData } from "./assessment-data";

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Mirror of the app's Better Auth config (kept in sync with src/server/auth/auth.ts)
// so seeded passwords hash identically to app sign-ups.
export const auth = betterAuth({
  appName: "SciDI Activity Check-in System",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: false,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "STUDENT", input: false },
      isAssessmentAccount: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },
});

export const TRACK_ENUM: Record<AssessmentTrackKey, string> = {
  A: "REGISTRATION",
  B: "EMAIL_OTP",
  C: "AUTH_SESSION",
  D: "ACTIVITY_MANAGEMENT",
  E: "QR_CHECKIN",
  F: "REPORT_ACCESS",
};

// Track -> the SAFE assessment scenario (spec v2 §22). These never weaken
// security; they introduce a detectable contract/message/format mismatch only.
export const SCENARIO_ENUM: Record<AssessmentTrackKey, string> = {
  A: "REGISTRATION_STATUS_CODE_MISMATCH",
  B: "OTP_ERROR_PRIORITY_MISMATCH",
  C: "SESSION_LOGOUT_MESSAGE_MISMATCH",
  D: "ACTIVITY_TRANSITION_VALIDATION_MISMATCH",
  E: "DUPLICATE_CHECKIN_STATUS_MISMATCH",
  F: "REPORT_FILTER_OR_SORT_MISMATCH",
};

export function hashOtp(otp: string, pepper: string): string {
  return crypto.createHmac("sha256", pepper).update(otp).digest("hex");
}

export function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function randomPassword(): string {
  // High-entropy, URL-safe, with guaranteed symbol/case for policy tools.
  return "Aa1!" + crypto.randomBytes(12).toString("base64url");
}

export function verifiedEmail(
  t: AssessmentTesterData,
  mode: "test" | "real",
  domain: string,
): string {
  return mode === "real" ? `${t.realStudentId}@${domain}` : t.verifiedEmailTest;
}

export function verifiedStudentId(
  t: AssessmentTesterData,
  mode: "test" | "real",
): string {
  return mode === "real" ? t.realStudentId : t.verifiedStudentIdTest;
}

/** Creates a Better Auth user (hashed password) or returns the existing id. */
export async function createAuthUser(
  email: string,
  password: string,
  name: string,
): Promise<string> {
  try {
    const res = await auth.api.signUpEmail({ body: { email, password, name } });
    return res.user.id;
  } catch (err) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return existing.id;
    throw err;
  }
}

export function requireAssessmentMode(): void {
  if (process.env.APP_MODE !== "assessment") {
    console.error(
      `Refusing to run: APP_MODE must be "assessment" (got "${process.env.APP_MODE ?? "unset"}").`,
    );
    process.exit(1);
  }
}

function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/**
 * Writes the teacher-only credential + assignment workbook to a CSV file.
 * Never served by the web app; file permissions set to owner-only.
 */
export function exportCredentials(
  testers: AssessmentTesterData[],
  opts: {
    emailMode: "test" | "real";
    realDomain: string;
    fixedOtp: boolean;
    publicAppUrl: string;
    exportDir: string;
    admin?: { email: string; password: string };
  },
): string {
  const header = [
    "testerCode",
    "fullName",
    "group",
    "track",
    "module",
    "whiteBoxFunction",
    "verifiedEmail",
    "verifiedPassword",
    "verifiedStudentId",
    "pendingEmail",
    "pendingPassword",
    "staffEmail",
    "staffPassword",
    "activityCode",
    "activityTitle",
    "qrToken",
    "checkinUrl",
    "datasetCode",
    "validStudentId",
    "fixedOtp",
    "defectFocus",
  ];
  const lines = [header.join(",")];
  for (const t of testers) {
    lines.push(
      [
        t.testerCode,
        t.fullName,
        String(t.groupNumber),
        t.track,
        t.module,
        t.whiteBoxFunction,
        verifiedEmail(t, opts.emailMode, opts.realDomain),
        t.verifiedPassword,
        verifiedStudentId(t, opts.emailMode),
        t.pendingEmailTest,
        t.pendingPassword,
        t.staffEmail,
        t.staffPassword,
        t.activityCode,
        t.activityTitle,
        t.qrToken,
        `${opts.publicAppUrl}/checkin/${t.qrToken}`,
        t.datasetCode,
        t.validStudentId,
        opts.fixedOtp ? t.fixedOtp : "(random)",
        t.defectFocus,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  if (opts.admin) {
    lines.push("");
    lines.push("ADMIN,email,password");
    lines.push(`admin,${csvCell(opts.admin.email)},${csvCell(opts.admin.password)}`);
  }

  fs.mkdirSync(opts.exportDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(
    opts.exportDir,
    `assessment-credentials-${stamp}.csv`,
  );
  fs.writeFileSync(file, "﻿" + lines.join("\r\n"), { mode: 0o600 });
  try {
    fs.chmodSync(file, 0o600);
  } catch {
    // best effort on non-POSIX
  }
  return file;
}

export const config = {
  emailMode: (process.env.ASSESSMENT_EMAIL_MODE === "real" ? "real" : "test") as
    | "test"
    | "real",
  realDomain: process.env.ASSESSMENT_REAL_EMAIL_DOMAIN || "tsu.ac.th",
  fixedOtp: process.env.ASSESSMENT_FIXED_OTP_ENABLED === "true",
  pepper: process.env.OTP_HASH_PEPPER ?? "",
  otpMinutes: Number(process.env.OTP_EXPIRES_MINUTES || 10),
  otpMax: Number(process.env.OTP_MAX_ATTEMPTS || 5),
  publicAppUrl: process.env.PUBLIC_APP_URL ?? "http://localhost:3000",
  exportDir: process.env.ASSESSMENT_EXPORT_DIR || "./artifacts",
};
