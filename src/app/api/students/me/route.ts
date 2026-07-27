import { route, success } from "@/server/lib/http";
import { requireSession } from "@/server/auth/guards";
import { prisma } from "@/server/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = route(async (req, requestId) => {
  const { user } = await requireSession(req);
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });
  return success(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      profile,
    },
    { requestId },
  );
});
