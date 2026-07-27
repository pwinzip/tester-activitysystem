-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('PENDING_EMAIL_VERIFICATION', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('STUDENT_EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "OtpStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'LOCKED');

-- CreateEnum
CREATE TYPE "AssessmentTrack" AS ENUM ('REGISTRATION', 'EMAIL_OTP', 'AUTH_SESSION', 'ACTIVITY_MANAGEMENT', 'QR_CHECKIN', 'REPORT_ACCESS');

-- CreateEnum
CREATE TYPE "AssessmentScenario" AS ENUM ('NONE', 'REGISTRATION_STATUS_CODE_MISMATCH', 'OTP_ERROR_PRIORITY_MISMATCH', 'SESSION_LOGOUT_MESSAGE_MISMATCH', 'ACTIVITY_TRANSITION_VALIDATION_MISMATCH', 'DUPLICATE_CHECKIN_STATUS_MISMATCH', 'REPORT_FILTER_OR_SORT_MISMATCH');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "isAssessmentAccount" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "major" TEXT NOT NULL,
    "yearLevel" INTEGER NOT NULL,
    "status" "StudentStatus" NOT NULL DEFAULT 'PENDING_EMAIL_VERIFICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_otp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'STUDENT_EMAIL_VERIFICATION',
    "status" "OtpStatus" NOT NULL DEFAULT 'ACTIVE',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity" (
    "id" TEXT NOT NULL,
    "activityCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'DRAFT',
    "qrToken" TEXT NOT NULL,
    "qrExpiresAt" TIMESTAMP(3),
    "ownerGroupCode" TEXT,
    "isAssessmentData" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "checkinTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkin_attempt" (
    "id" TEXT NOT NULL,
    "activityId" TEXT,
    "studentProfileId" TEXT,
    "qrTokenFingerprint" TEXT,
    "resultCode" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "requestId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkin_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "requestId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_assignment" (
    "id" TEXT NOT NULL,
    "testerCode" TEXT NOT NULL,
    "groupNumber" INTEGER NOT NULL,
    "track" "AssessmentTrack" NOT NULL,
    "datasetCode" TEXT NOT NULL,
    "scenarioCode" "AssessmentScenario" NOT NULL DEFAULT 'NONE',
    "assignedFunction" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "studentUserId" TEXT NOT NULL,
    "pendingUserId" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE INDEX "user_isAssessmentAccount_idx" ON "user"("isAssessmentAccount");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "session_expiresAt_idx" ON "session"("expiresAt");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "verification_expiresAt_idx" ON "verification"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "student_profile_userId_key" ON "student_profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "student_profile_studentId_key" ON "student_profile"("studentId");

-- CreateIndex
CREATE INDEX "student_profile_studentId_idx" ON "student_profile"("studentId");

-- CreateIndex
CREATE INDEX "student_profile_status_idx" ON "student_profile"("status");

-- CreateIndex
CREATE INDEX "email_otp_userId_idx" ON "email_otp"("userId");

-- CreateIndex
CREATE INDEX "email_otp_email_idx" ON "email_otp"("email");

-- CreateIndex
CREATE INDEX "email_otp_status_idx" ON "email_otp"("status");

-- CreateIndex
CREATE INDEX "email_otp_expiresAt_idx" ON "email_otp"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "activity_activityCode_key" ON "activity"("activityCode");

-- CreateIndex
CREATE UNIQUE INDEX "activity_qrToken_key" ON "activity"("qrToken");

-- CreateIndex
CREATE INDEX "activity_status_idx" ON "activity"("status");

-- CreateIndex
CREATE INDEX "activity_activityDate_idx" ON "activity"("activityDate");

-- CreateIndex
CREATE INDEX "activity_qrToken_idx" ON "activity"("qrToken");

-- CreateIndex
CREATE INDEX "activity_ownerGroupCode_idx" ON "activity"("ownerGroupCode");

-- CreateIndex
CREATE INDEX "activity_isAssessmentData_idx" ON "activity"("isAssessmentData");

-- CreateIndex
CREATE INDEX "attendance_activityId_idx" ON "attendance"("activityId");

-- CreateIndex
CREATE INDEX "attendance_studentProfileId_idx" ON "attendance"("studentProfileId");

-- CreateIndex
CREATE INDEX "attendance_checkinTime_idx" ON "attendance"("checkinTime");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_activityId_studentProfileId_key" ON "attendance"("activityId", "studentProfileId");

-- CreateIndex
CREATE INDEX "checkin_attempt_activityId_idx" ON "checkin_attempt"("activityId");

-- CreateIndex
CREATE INDEX "checkin_attempt_studentProfileId_idx" ON "checkin_attempt"("studentProfileId");

-- CreateIndex
CREATE INDEX "checkin_attempt_resultCode_idx" ON "checkin_attempt"("resultCode");

-- CreateIndex
CREATE INDEX "checkin_attempt_createdAt_idx" ON "checkin_attempt"("createdAt");

-- CreateIndex
CREATE INDEX "audit_log_actorUserId_idx" ON "audit_log"("actorUserId");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_entityType_entityId_idx" ON "audit_log"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_assignment_testerCode_key" ON "assessment_assignment"("testerCode");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_assignment_datasetCode_key" ON "assessment_assignment"("datasetCode");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_assignment_activityId_key" ON "assessment_assignment"("activityId");

-- CreateIndex
CREATE INDEX "assessment_assignment_groupNumber_idx" ON "assessment_assignment"("groupNumber");

-- CreateIndex
CREATE INDEX "assessment_assignment_track_idx" ON "assessment_assignment"("track");

-- CreateIndex
CREATE INDEX "assessment_assignment_scenarioCode_idx" ON "assessment_assignment"("scenarioCode");

-- CreateIndex
CREATE INDEX "assessment_assignment_active_idx" ON "assessment_assignment"("active");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_otp" ADD CONSTRAINT "email_otp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_attempt" ADD CONSTRAINT "checkin_attempt_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkin_attempt" ADD CONSTRAINT "checkin_attempt_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_assignment" ADD CONSTRAINT "assessment_assignment_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_assignment" ADD CONSTRAINT "assessment_assignment_pendingUserId_fkey" FOREIGN KEY ("pendingUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_assignment" ADD CONSTRAINT "assessment_assignment_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_assignment" ADD CONSTRAINT "assessment_assignment_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
