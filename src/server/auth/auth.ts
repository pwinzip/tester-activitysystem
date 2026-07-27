import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/server/lib/prisma";
import { env } from "@/server/lib/env";

export const auth = betterAuth({
  appName: "SciDI Activity Check-in System",
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // Student email ownership is proven via our custom OTP flow, not the
    // built-in link verification. Sign-in is additionally gated in app code
    // (email verified + student ACTIVE) at the API layer.
    requireEmailVerification: false,
    // Registration must NOT sign the student in — they verify OTP first.
    autoSignIn: false,
  },
  session: {
    storeSessionInDatabase: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "STUDENT",
        input: false,
      },
      isAssessmentAccount: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  trustedOrigins: [env.PUBLIC_APP_URL],
  advanced: {
    // Key secure cookies off the deployment URL, not NODE_ENV, so a
    // production build served over http://localhost (Docker) still works.
    useSecureCookies: env.PUBLIC_APP_URL.startsWith("https://"),
    cookiePrefix: "scidi-activity",
  },
});

export type Auth = typeof auth;
