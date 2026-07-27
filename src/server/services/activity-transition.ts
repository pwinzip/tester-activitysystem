// Pure activity state-transition logic (spec v2 §19.4). Jest white-box target.
export type ActivityTransitionResult =
  | "STATUS_CHANGE_ALLOWED"
  | "ROLE_NOT_ALLOWED"
  | "INVALID_TRANSITION"
  | "INVALID_TIME_RANGE";

export type ActivityStatusName = "DRAFT" | "OPEN" | "CLOSED" | "CANCELLED";
export type RoleName = "STUDENT" | "STAFF" | "ADMIN";

type ActivityTransitionInput = {
  role: RoleName;
  currentStatus: ActivityStatusName;
  nextStatus: ActivityStatusName;
  startTime: Date;
  endTime: Date;
};

// Allowed transitions (spec v2 §9). CLOSED and CANCELLED are terminal.
const allowedTransitions: Record<ActivityStatusName, ActivityStatusName[]> = {
  DRAFT: ["OPEN", "CANCELLED"],
  OPEN: ["CLOSED", "CANCELLED"],
  CLOSED: [],
  CANCELLED: [],
};

export function evaluateActivityTransition(
  input: ActivityTransitionInput,
): ActivityTransitionResult {
  if (input.role !== "STAFF" && input.role !== "ADMIN") {
    return "ROLE_NOT_ALLOWED";
  }
  if (input.endTime.getTime() <= input.startTime.getTime()) {
    return "INVALID_TIME_RANGE";
  }
  if (!allowedTransitions[input.currentStatus].includes(input.nextStatus)) {
    return "INVALID_TRANSITION";
  }
  return "STATUS_CHANGE_ALLOWED";
}
