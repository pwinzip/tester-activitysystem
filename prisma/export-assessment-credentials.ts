import "dotenv/config";
import { ASSESSMENT_TESTERS } from "./assessment-data";
import { config, exportCredentials, prisma } from "./assessment-helpers";

// Re-exports the teacher credential/assignment CSV from the static workbook
// data. Student/staff passwords are the fixed workbook values; the admin.demo
// password is random per seed and is only printed at seed time (not here).
async function main() {
  const file = exportCredentials(ASSESSMENT_TESTERS, {
    emailMode: config.emailMode,
    realDomain: config.realDomain,
    fixedOtp: config.fixedOtp,
    publicAppUrl: config.publicAppUrl,
    exportDir: config.exportDir,
  });
  console.log(`[assessment:export] wrote ${file}`);
  console.log(
    "[assessment:export] note: admin.demo password is shown only during assessment:seed.",
  );
}

main()
  .catch((err) => {
    console.error("[assessment:export] failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
