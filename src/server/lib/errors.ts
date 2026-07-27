// Stable error-code contract (spec v2 §16).
export const ERROR_STATUS = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 422,
  EMAIL_ALREADY_EXISTS: 409,
  STUDENT_ID_ALREADY_EXISTS: 409,
  AUTH_REQUIRED: 401,
  FORBIDDEN: 403,
  EMAIL_NOT_VERIFIED: 403,
  USER_SUSPENDED: 403,
  OTP_INVALID: 400,
  OTP_EXPIRED: 400,
  OTP_USED: 409,
  OTP_ATTEMPT_LIMIT_EXCEEDED: 429,
  OTP_RESEND_RATE_LIMITED: 429,
  ACTIVITY_NOT_FOUND: 404,
  USER_NOT_FOUND: 404,
  INVALID_QR: 404,
  ACTIVITY_NOT_OPEN: 409,
  OUTSIDE_CHECKIN_TIME: 409,
  DUPLICATE_CHECKIN: 409,
  INVALID_ACTIVITY_TRANSITION: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export interface ErrorDetail {
  field?: string;
  message: string;
}

/**
 * Application error carrying a stable error code, HTTP status, and safe
 * client-facing message. Never attach stack traces or internal data here.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: ErrorDetail[];

  constructor(code: ErrorCode, message: string, details: ErrorDetail[] = []) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = ERROR_STATUS[code];
    this.details = details;
  }
}
