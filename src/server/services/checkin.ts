// Pure check-in decision (spec v2 §19.5). Jest white-box target; the same
// function backs UI, API, and tests.
export type CheckInResult =
  | "AUTH_REQUIRED"
  | "EMAIL_NOT_VERIFIED"
  | "STUDENT_NOT_ACTIVE"
  | "INVALID_QR"
  | "ACTIVITY_NOT_OPEN"
  | "OUTSIDE_CHECKIN_TIME"
  | "DUPLICATE_CHECKIN"
  | "CHECKIN_ALLOWED";

type CanCheckInInput = {
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  studentStatus: "PENDING_EMAIL_VERIFICATION" | "ACTIVE" | "SUSPENDED";
  isValidQR: boolean;
  activityStatus: "DRAFT" | "OPEN" | "CLOSED" | "CANCELLED";
  isWithinTime: boolean;
  alreadyCheckedIn: boolean;
};

export function canCheckIn(input: CanCheckInInput): CheckInResult {
  if (!input.isAuthenticated) return "AUTH_REQUIRED";
  if (!input.isEmailVerified) return "EMAIL_NOT_VERIFIED";
  if (input.studentStatus !== "ACTIVE") return "STUDENT_NOT_ACTIVE";
  if (!input.isValidQR) return "INVALID_QR";
  if (input.activityStatus !== "OPEN") return "ACTIVITY_NOT_OPEN";
  if (!input.isWithinTime) return "OUTSIDE_CHECKIN_TIME";
  if (input.alreadyCheckedIn) return "DUPLICATE_CHECKIN";
  return "CHECKIN_ALLOWED";
}
