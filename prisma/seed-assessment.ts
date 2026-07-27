import "dotenv/config";
import { ASSESSMENT_TESTERS } from "./assessment-data";
import {
  prisma,
  config,
  TRACK_ENUM,
  SCENARIO_ENUM,
  hashOtp,
  generateOtp,
  randomPassword,
  createAuthUser,
  verifiedEmail,
  verifiedStudentId,
  requireAssessmentMode,
  exportCredentials,
} from "./assessment-helpers";

async function setUser(
  id: string,
  data: { role: string; emailVerified: boolean },
) {
  await prisma.user.update({
    where: { id },
    data: {
      role: data.role as "STUDENT" | "STAFF" | "ADMIN",
      emailVerified: data.emailVerified,
      isAssessmentAccount: true,
    },
  });
}

async function main() {
  requireAssessmentMode();
  if (!config.pepper) {
    console.error("OTP_HASH_PEPPER is required.");
    process.exit(1);
  }

  console.log(
    `[assessment:seed] mode=${config.emailMode} fixedOtp=${config.fixedOtp}`,
  );

  // 1) Instructor admin (random password, exported to teacher file only).
  const adminEmail = "admin.demo@qa.local";
  const adminPassword = randomPassword();
  const adminId = await createAuthUser(adminEmail, adminPassword, "Instructor Admin");
  await setUser(adminId, { role: "ADMIN", emailVerified: true });

  // 2) Staff (one per unique staff email — 9 groups).
  const staffByEmail = new Map<string, string>();
  for (const t of ASSESSMENT_TESTERS) {
    if (staffByEmail.has(t.staffEmail)) continue;
    const id = await createAuthUser(t.staffEmail, t.staffPassword, `Staff G${t.groupNumber}`);
    await setUser(id, { role: "STAFF", emailVerified: true });
    staffByEmail.set(t.staffEmail, id);
  }
  console.log(`[assessment:seed] staff accounts: ${staffByEmail.size}`);

  // 3) Per tester: verified + pending students, activity, OTP, assignment.
  for (const t of ASSESSMENT_TESTERS) {
    const staffId = staffByEmail.get(t.staffEmail)!;

    // Verified (ACTIVE) student
    const vEmail = verifiedEmail(t, config.emailMode, config.realDomain);
    const vSid = verifiedStudentId(t, config.emailMode);
    const vId = await createAuthUser(vEmail, t.verifiedPassword, t.fullName);
    await setUser(vId, { role: "STUDENT", emailVerified: true });
    await prisma.studentProfile.upsert({
      where: { userId: vId },
      update: { studentId: vSid, fullName: t.fullName, status: "ACTIVE" },
      create: {
        userId: vId,
        studentId: vSid,
        fullName: t.fullName,
        major: `Assessment Track ${t.track}`,
        yearLevel: 1,
        status: "ACTIVE",
      },
    });

    // Pending (unverified) student
    const pId = await createAuthUser(t.pendingEmailTest, t.pendingPassword, `Pending ${t.testerCode}`);
    await setUser(pId, { role: "STUDENT", emailVerified: false });
    await prisma.studentProfile.upsert({
      where: { userId: pId },
      update: { studentId: t.pendingStudentId, status: "PENDING_EMAIL_VERIFICATION" },
      create: {
        userId: pId,
        studentId: t.pendingStudentId,
        fullName: `Pending Tester ${t.testerCode}`,
        major: `Assessment Track ${t.track}`,
        yearLevel: 1,
        status: "PENDING_EMAIL_VERIFICATION",
      },
    });

    // Fresh OTP for the pending account (deterministic when fixed-OTP is on).
    const otp = config.fixedOtp ? t.fixedOtp : generateOtp();
    await prisma.emailOtp.deleteMany({ where: { userId: pId } });
    await prisma.emailOtp.create({
      data: {
        userId: pId,
        email: t.pendingEmailTest,
        otpHash: hashOtp(otp, config.pepper),
        purpose: "STUDENT_EMAIL_VERIFICATION",
        status: "ACTIVE",
        maxAttempts: config.otpMax,
        expiresAt: new Date(Date.now() + config.otpMinutes * 60_000),
      },
    });

    // Activity + QR (OPEN, window from the workbook).
    const activity = await prisma.activity.upsert({
      where: { activityCode: t.activityCode },
      update: {
        qrToken: t.qrToken,
        title: t.activityTitle,
        activityDate: new Date(t.checkinStart),
        startTime: new Date(t.checkinStart),
        endTime: new Date(t.checkinEnd),
        status: "OPEN",
        ownerGroupCode: `G${t.groupNumber}`,
        isAssessmentData: true,
        createdById: staffId,
      },
      create: {
        activityCode: t.activityCode,
        qrToken: t.qrToken,
        title: t.activityTitle,
        description: `Assessment activity for ${t.testerCode}`,
        activityDate: new Date(t.checkinStart),
        startTime: new Date(t.checkinStart),
        endTime: new Date(t.checkinEnd),
        location: "Assessment Venue",
        status: "OPEN",
        ownerGroupCode: `G${t.groupNumber}`,
        isAssessmentData: true,
        createdById: staffId,
      },
    });

    // Optional duplicate-attendance preseed (verified student already checked in).
    if (t.duplicatePreseed) {
      const vProfile = await prisma.studentProfile.findUnique({
        where: { userId: vId },
        select: { id: true },
      });
      if (vProfile) {
        await prisma.attendance.upsert({
          where: {
            activityId_studentProfileId: {
              activityId: activity.id,
              studentProfileId: vProfile.id,
            },
          },
          update: {},
          create: {
            activityId: activity.id,
            studentProfileId: vProfile.id,
            ipAddress: "seed",
            userAgent: "assessment-seed",
          },
        });
      }
    }

    // Assignment (one per tester).
    await prisma.assessmentAssignment.upsert({
      where: { testerCode: t.testerCode },
      update: {
        groupNumber: t.groupNumber,
        track: TRACK_ENUM[t.track] as never,
        datasetCode: t.datasetCode,
        scenarioCode: SCENARIO_ENUM[t.track] as never,
        assignedFunction: t.whiteBoxFunction,
        active: true,
        notes: t.defectFocus,
        studentUserId: vId,
        pendingUserId: pId,
        staffUserId: staffId,
        activityId: activity.id,
      },
      create: {
        testerCode: t.testerCode,
        groupNumber: t.groupNumber,
        track: TRACK_ENUM[t.track] as never,
        datasetCode: t.datasetCode,
        scenarioCode: SCENARIO_ENUM[t.track] as never,
        assignedFunction: t.whiteBoxFunction,
        active: true,
        notes: t.defectFocus,
        studentUserId: vId,
        pendingUserId: pId,
        staffUserId: staffId,
        activityId: activity.id,
      },
    });

    console.log(`[assessment:seed] ${t.testerCode} ok`);
  }

  const file = exportCredentials(ASSESSMENT_TESTERS, {
    emailMode: config.emailMode,
    realDomain: config.realDomain,
    fixedOtp: config.fixedOtp,
    publicAppUrl: config.publicAppUrl,
    exportDir: config.exportDir,
    admin: { email: adminEmail, password: adminPassword },
  });

  console.log(`\n[assessment:seed] complete. 22 testers, ${staffByEmail.size} staff, 1 admin.`);
  console.log(`[assessment:seed] teacher credentials exported -> ${file}`);
  console.log(`[assessment:seed] admin.demo password (store safely): ${adminPassword}`);
}

main()
  .catch((err) => {
    console.error("[assessment:seed] failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
