import "dotenv/config";
import { prisma, requireAssessmentMode } from "./assessment-helpers";

async function main() {
  requireAssessmentMode();

  const provided = process.argv[2]?.trim();
  const expected = process.env.ASSESSMENT_CONFIRMATION_TOKEN?.trim();

  if (!expected) {
    console.error("ASSESSMENT_CONFIRMATION_TOKEN must be set to purge.");
    process.exit(1);
  }
  if (provided !== expected) {
    console.error(
      "Confirmation token mismatch. Usage: npm run assessment:purge -- <ASSESSMENT_CONFIRMATION_TOKEN>",
    );
    process.exit(1);
  }

  // Order matters: assignments -> assessment activities (Activity.createdBy is
  // RESTRICT) -> assessment users. Only rows explicitly marked as assessment
  // data are removed; production data is never touched.
  const assignments = await prisma.assessmentAssignment.deleteMany({});
  const activities = await prisma.activity.deleteMany({
    where: { isAssessmentData: true },
  });
  const users = await prisma.user.deleteMany({
    where: { isAssessmentAccount: true },
  });

  console.log(
    `[assessment:purge] removed assignments=${assignments.count} activities=${activities.count} users=${users.count}`,
  );
}

main()
  .catch((err) => {
    console.error("[assessment:purge] failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
