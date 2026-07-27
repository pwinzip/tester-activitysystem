import { Badge } from "./ui";
import type { ActivityStatus, StudentStatus, Role } from "@/lib/types";

const activityTone: Record<
  ActivityStatus,
  "muted" | "success" | "indigo" | "error"
> = {
  DRAFT: "muted",
  OPEN: "success",
  CLOSED: "indigo",
  CANCELLED: "error",
};

export function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
  return <Badge tone={activityTone[status]}>{status}</Badge>;
}

const studentTone: Record<StudentStatus, "warning" | "success" | "error"> = {
  PENDING_EMAIL_VERIFICATION: "warning",
  ACTIVE: "success",
  SUSPENDED: "error",
};

const studentLabel: Record<StudentStatus, string> = {
  PENDING_EMAIL_VERIFICATION: "Pending",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
};

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  return <Badge tone={studentTone[status]}>{studentLabel[status]}</Badge>;
}

const roleTone: Record<Role, "muted" | "cyan" | "indigo"> = {
  STUDENT: "muted",
  STAFF: "cyan",
  ADMIN: "indigo",
};

export function RoleBadge({ role }: { role: Role }) {
  return <Badge tone={roleTone[role]}>{role}</Badge>;
}
