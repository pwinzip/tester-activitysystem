export type Role = "STUDENT" | "STAFF" | "ADMIN";
export type ActivityStatus = "DRAFT" | "OPEN" | "CLOSED" | "CANCELLED";
export type StudentStatus =
  | "PENDING_EMAIL_VERIFICATION"
  | "ACTIVE"
  | "SUSPENDED";

export interface Me {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  emailVerified: boolean;
  profile: {
    studentId: string;
    fullName: string;
    major: string;
    yearLevel: number;
    status: StudentStatus;
  } | null;
}

export interface ActivitySummary {
  id: string;
  activityCode: string;
  title: string;
  description: string | null;
  activityDate: string;
  startTime: string;
  endTime: string;
  location: string;
  status: ActivityStatus;
  ownerGroupCode: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  checkinTime: string;
  activity: {
    activityCode: string;
    title: string;
    activityDate: string;
    location: string;
  };
}

export interface CheckinSummary {
  activity: {
    id: string;
    activityCode: string;
    title: string;
    description: string | null;
    activityDate: string;
    startTime: string;
    endTime: string;
    location: string;
    status: ActivityStatus;
  };
  alreadyCheckedIn: boolean;
}

export interface QrInfo {
  activityId: string;
  activityCode: string;
  title: string;
  status: ActivityStatus;
  qrToken: string;
  qrExpiresAt: string | null;
  checkinUrl: string;
}

export interface Participant {
  id: string;
  checkinTime: string;
  studentProfile: {
    studentId: string;
    fullName: string;
    major: string;
    yearLevel: number;
  };
}

export interface ParticipantsResult {
  activity: {
    id: string;
    activityCode: string;
    title: string;
    status: ActivityStatus;
  };
  total: number;
  participants: Participant[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  emailVerified: boolean;
  isAssessmentAccount: boolean;
  createdAt: string;
  studentProfile: {
    studentId: string;
    status: StudentStatus;
    major: string;
    yearLevel: number;
  } | null;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  requestId: string | null;
  createdAt: string;
  actorUser: {
    id: string;
    email: string;
    name: string | null;
    role: Role;
  } | null;
}
