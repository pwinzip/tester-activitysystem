import { route, readJson, success } from "@/server/lib/http";
import { verifyEmailSchema } from "@/server/validators/student";
import { verifyStudentEmail } from "@/server/services/student-registration";

export const POST = route(async (req, requestId) => {
  const body = await readJson(req);
  const input = verifyEmailSchema.parse(body);
  const data = await verifyStudentEmail(input);
  return success(data, { requestId });
});
