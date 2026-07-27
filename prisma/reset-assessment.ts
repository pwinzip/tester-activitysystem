import "dotenv/config";
import { ASSESSMENT_TESTERS } from "./assessment-data";
import {
  prisma,
  config,
  hashOtp,
  generateOtp,
  requireAssessmentMode,
} from "./assessment-helpers";

async function main() {
  requireAssessmentMode();

  const testerCode = process.argv[2]?.trim().toUpperCase();
  if (!testerCode) {
    console.error("Usage: npm run assessment:reset -- T01");
    process.exit(1);
  }

  const t = ASSESSMENT_TESTERS.find((x) => x.testerCode === testerCode);
  const assignment = await prisma.assessmentAssignment.findUnique({
    where: { testerCode },
  });
  if (!t || !assignment) {
    console.error(`Tester ${testerCode} not found. Run assessment:seed first.`);
    process.exit(1);
  }

  const { studentUserId, pendingUserId, activityId } = assignment;

  await prisma.$transaction(async (tx) => {
    // 1) Wipe attendance + check-in attempts for this tester's activity.
    await tx.attendance.deleteMany({ where: { activityId } });
    await tx.checkinAttempt.deleteMany({ where: { activityId } });

    // 2) Revoke sessions for the tester's assigned accounts.
    await tx.session.deleteMany({
      where: { userId: { in: [studentUserId, pendingUserId] } },
    });

    // 3) Reset the pending account back to unverified + fresh OTP.
    await tx.user.update({
      where: { id: pendingUserId },
      data: { emailVerified: false },
    });
    await tx.studentProfile.update({
      where: { userId: pendingUserId },
      data: { status: "PENDING_EMAIL_VERIFICATION" },
    });
    await tx.emailOtp.deleteMany({ where: { userId: pendingUserId } });
    const otp = config.fixedOtp ? t.fixedOtp : generateOtp();
    await tx.emailOtp.create({
      data: {
        userId: pendingUserId,
        email: t.pendingEmailTest,
        otpHash: hashOtp(otp, config.pepper),
        purpose: "STUDENT_EMAIL_VERIFICATION",
        status: "ACTIVE",
        maxAttempts: config.otpMax,
        expiresAt: new Date(Date.now() + config.otpMinutes * 60_000),
      },
    });

    // 4) Ensure the verified account is ACTIVE + verified.
    await tx.user.update({
      where: { id: studentUserId },
      data: { emailVerified: true },
    });
    await tx.studentProfile.update({
      where: { userId: studentUserId },
      data: { status: "ACTIVE" },
    });

    // 5) Restore the activity's status + check-in window.
    await tx.activity.update({
      where: { id: activityId },
      data: {
        status: "OPEN",
        startTime: new Date(t.checkinStart),
        endTime: new Date(t.checkinEnd),
        activityDate: new Date(t.checkinStart),
      },
    });

    // 6) Remove a stray account the tester may have registered during the
    //    Track-A test (uses the dataset's Valid Student ID).
    const stray = await tx.studentProfile.findUnique({
      where: { studentId: t.validStudentId },
      select: { userId: true },
    });
    if (stray) {
      await tx.user.delete({ where: { id: stray.userId } });
    }
  });

  console.log(`[assessment:reset] ${testerCode} reset complete.`);
}

main()
  .catch((err) => {
    console.error("[assessment:reset] failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
