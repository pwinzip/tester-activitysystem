import crypto from "node:crypto";

// Pure OTP logic (spec v2 §19.2). No env/DB access — Jest white-box target.
export type OtpVerificationResult =
  | "OTP_VALID"
  | "OTP_INVALID"
  | "OTP_EXPIRED"
  | "OTP_USED"
  | "OTP_ATTEMPT_LIMIT_EXCEEDED";

export function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(otp: string, pepper: string): string {
  return crypto.createHmac("sha256", pepper).update(otp).digest("hex");
}

export function isOtpExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return now.getTime() >= expiresAt.getTime();
}

type CanVerifyOtpInput = {
  otpMatched: boolean;
  isExpired: boolean;
  isUsed: boolean;
  attempts: number;
  maxAttempts: number;
};

export function canVerifyOtp(input: CanVerifyOtpInput): OtpVerificationResult {
  if (input.isUsed) return "OTP_USED";
  if (input.isExpired) return "OTP_EXPIRED";
  if (input.attempts >= input.maxAttempts) {
    return "OTP_ATTEMPT_LIMIT_EXCEEDED";
  }
  if (!input.otpMatched) return "OTP_INVALID";
  return "OTP_VALID";
}
