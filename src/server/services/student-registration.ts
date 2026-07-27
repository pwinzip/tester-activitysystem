import { prisma } from "@/server/lib/prisma";
import { auth } from "@/server/auth/auth";
import { env } from "@/server/lib/env";
import { AppError } from "@/server/lib/errors";
import { logger } from "@/server/lib/logger";
import { sendOtpEmail } from "@/server/mail/mailer";
import {
  generateOtp,
  hashOtp,
  isOtpExpired,
  canVerifyOtp,
} from "@/server/services/otp";
import type {
  RegisterInput,
  VerifyEmailInput,
  ResendOtpInput,
} from "@/server/validators/student";

const RESEND_COOLDOWN_MS = 60_000;

function otpExpiry(): Date {
  return new Date(Date.now() + env.OTP_EXPIRES_MINUTES * 60_000);
}

/**
 * Registers a student: creates the Better Auth user (password hashed by Better
 * Auth), a PENDING student profile, and an active hashed OTP; then emails it.
 */
export async function registerStudent(input: RegisterInput) {
  // Fast, coded uniqueness checks (DB constraints are the backstop).
  const existingEmail = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existingEmail) {
    throw new AppError("EMAIL_ALREADY_EXISTS", "Email already registered.");
  }
  const existingStudentId = await prisma.studentProfile.findUnique({
    where: { studentId: input.studentId },
  });
  if (existingStudentId) {
    throw new AppError(
      "STUDENT_ID_ALREADY_EXISTS",
      "Student ID already registered.",
    );
  }

  let userId: string;
  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: input.email,
        password: input.password,
        name: input.fullName,
      },
    });
    userId = result.user.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : "";
    if (msg.includes("exist")) {
      throw new AppError("EMAIL_ALREADY_EXISTS", "Email already registered.");
    }
    throw err;
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp, env.OTP_HASH_PEPPER);

  try {
    await prisma.$transaction([
      prisma.studentProfile.create({
        data: {
          userId,
          studentId: input.studentId,
          fullName: input.fullName,
          major: input.major,
          yearLevel: input.yearLevel,
          status: "PENDING_EMAIL_VERIFICATION",
        },
      }),
      prisma.emailOtp.create({
        data: {
          userId,
          email: input.email,
          otpHash,
          purpose: "STUDENT_EMAIL_VERIFICATION",
          status: "ACTIVE",
          maxAttempts: env.OTP_MAX_ATTEMPTS,
          expiresAt: otpExpiry(),
        },
      }),
    ]);
  } catch (err) {
    // Avoid orphaning the Better Auth user if profile/OTP creation fails.
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    if (isUniqueViolation(err, "studentId")) {
      throw new AppError(
        "STUDENT_ID_ALREADY_EXISTS",
        "Student ID already registered.",
      );
    }
    throw err;
  }

  await sendOtpEmail(input.email, otp);
  logger.info("student_registered", { userId });

  return {
    userId,
    email: input.email,
    status: "PENDING_EMAIL_VERIFICATION" as const,
  };
}

/** Verifies a student's email using the latest OTP for the account. */
export async function verifyStudentEmail(input: VerifyEmailInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { studentProfile: true },
  });
  // Generic error to avoid revealing whether the email exists.
  if (!user) {
    throw new AppError("OTP_INVALID", "Invalid or expired code.");
  }

  const otpRecord = await prisma.emailOtp.findFirst({
    where: { userId: user.id, purpose: "STUDENT_EMAIL_VERIFICATION" },
    orderBy: { createdAt: "desc" },
  });
  if (!otpRecord) {
    throw new AppError("OTP_INVALID", "Invalid or expired code.");
  }

  const result = canVerifyOtp({
    otpMatched: hashOtp(input.otp, env.OTP_HASH_PEPPER) === otpRecord.otpHash,
    isExpired: isOtpExpired(otpRecord.expiresAt),
    isUsed: otpRecord.status === "USED",
    attempts: otpRecord.attempts,
    maxAttempts: otpRecord.maxAttempts,
  });

  switch (result) {
    case "OTP_VALID": {
      await prisma.$transaction([
        prisma.emailOtp.update({
          where: { id: otpRecord.id },
          data: { status: "USED", usedAt: new Date() },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        }),
        prisma.studentProfile.update({
          where: { userId: user.id },
          data: { status: "ACTIVE" },
        }),
      ]);
      logger.info("student_email_verified", { userId: user.id });
      return { verified: true };
    }
    case "OTP_USED":
      throw new AppError("OTP_USED", "This code has already been used.");
    case "OTP_EXPIRED":
      await prisma.emailOtp.update({
        where: { id: otpRecord.id },
        data: { status: "EXPIRED" },
      });
      throw new AppError(
        "OTP_EXPIRED",
        "This code has expired. Please request a new one.",
      );
    case "OTP_ATTEMPT_LIMIT_EXCEEDED":
      await prisma.emailOtp.update({
        where: { id: otpRecord.id },
        data: { status: "LOCKED" },
      });
      throw new AppError(
        "OTP_ATTEMPT_LIMIT_EXCEEDED",
        "Too many attempts. Please request a new code.",
      );
    case "OTP_INVALID": {
      const attempts = otpRecord.attempts + 1;
      await prisma.emailOtp.update({
        where: { id: otpRecord.id },
        data: {
          attempts,
          ...(attempts >= otpRecord.maxAttempts
            ? { status: "LOCKED" as const }
            : {}),
        },
      });
      throw new AppError("OTP_INVALID", "Incorrect code. Please try again.");
    }
  }
}

/** Issues a fresh OTP for a pending student, rate-limited per account. */
export async function resendStudentOtp(input: ResendOtpInput) {
  const generic = {
    message:
      "If the account exists and is pending verification, a new code has been sent.",
  };

  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { studentProfile: true },
  });
  if (
    !user ||
    user.emailVerified ||
    !user.studentProfile ||
    user.studentProfile.status !== "PENDING_EMAIL_VERIFICATION"
  ) {
    return generic;
  }

  const last = await prisma.emailOtp.findFirst({
    where: { userId: user.id, purpose: "STUDENT_EMAIL_VERIFICATION" },
    orderBy: { createdAt: "desc" },
  });
  if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    throw new AppError(
      "OTP_RESEND_RATE_LIMITED",
      "Please wait before requesting another code.",
    );
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp, env.OTP_HASH_PEPPER);
  await prisma.$transaction([
    prisma.emailOtp.updateMany({
      where: {
        userId: user.id,
        purpose: "STUDENT_EMAIL_VERIFICATION",
        status: "ACTIVE",
      },
      data: { status: "EXPIRED" },
    }),
    prisma.emailOtp.create({
      data: {
        userId: user.id,
        email: user.email,
        otpHash,
        purpose: "STUDENT_EMAIL_VERIFICATION",
        status: "ACTIVE",
        maxAttempts: env.OTP_MAX_ATTEMPTS,
        expiresAt: otpExpiry(),
      },
    }),
  ]);

  await sendOtpEmail(user.email, otp);
  logger.info("student_otp_resent", { userId: user.id });
  return generic;
}

// Detects a Prisma unique-constraint violation (P2002) on a given field.
function isUniqueViolation(err: unknown, field: string): boolean {
  const e = err as { code?: string; meta?: { target?: string[] | string } };
  if (e?.code !== "P2002") return false;
  const target = e.meta?.target;
  if (Array.isArray(target)) return target.includes(field);
  return typeof target === "string" ? target.includes(field) : false;
}
