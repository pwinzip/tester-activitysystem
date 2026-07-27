import { route, readJson, success } from "@/server/lib/http";
import { registerSchema } from "@/server/validators/student";
import { registerStudent } from "@/server/services/student-registration";

export const POST = route(async (req, requestId) => {
  const body = await readJson(req);
  const input = registerSchema.parse(body);
  const data = await registerStudent(input);
  return success(data, { status: 201, requestId });
});
