// Pure attendance-report access decision (spec v2 §19.6). Jest white-box target.
export type ReportAccessResult =
  | "REPORT_ACCESS_ALLOWED"
  | "AUTH_REQUIRED"
  | "ROLE_NOT_ALLOWED"
  | "NOT_ACTIVITY_OWNER";

type ReportAccessInput = {
  isAuthenticated: boolean;
  role: "STUDENT" | "STAFF" | "ADMIN";
  isActivityOwnerOrInScope: boolean;
};

export function canViewAttendanceReport(
  input: ReportAccessInput,
): ReportAccessResult {
  if (!input.isAuthenticated) return "AUTH_REQUIRED";
  if (input.role === "ADMIN") return "REPORT_ACCESS_ALLOWED";
  if (input.role !== "STAFF") return "ROLE_NOT_ALLOWED";
  if (!input.isActivityOwnerOrInScope) return "NOT_ACTIVITY_OWNER";
  return "REPORT_ACCESS_ALLOWED";
}
