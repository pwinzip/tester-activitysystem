import { route, readJson, success } from "@/server/lib/http";
import { resendOtpSchema } from "@/server/validators/student";
import { resendStudentOtp } from "@/server/services/student-registration";

export const POST = route(async (req, requestId) => {
  const body = await readJson(req);
  const input = resendOtpSchema.parse(body);
  const data = await resendStudentOtp(input);
  return success(data, { requestId });
});
