import { z } from "zod";

// String-boolean helper: env vars are always strings.
const boolEnv = (def: "true" | "false") =>
  z
    .string()
    .default(def)
    .transform((v) => v === "true");

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_MODE: z
      .enum(["development", "assessment", "production"])
      .default("development"),

    PUBLIC_APP_URL: z.url(),
    NEXT_PUBLIC_APP_URL: z.url().optional(),
    NEXT_PUBLIC_API_BASE_URL: z.string().default("/api"),

    DATABASE_URL: z.string().min(1),

    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    BETTER_AUTH_URL: z.url(),

    MAIL_PROVIDER: z.enum(["console", "smtp"]).default("console"),
    SMTP_HOST: z.string().default(""),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: boolEnv("false"),
    SMTP_USER: z.string().default(""),
    SMTP_PASS: z.string().default(""),
    SMTP_FROM: z.string().default("SciDI Activity <no-reply@example.local>"),

    OTP_EXPIRES_MINUTES: z.coerce.number().int().positive().default(10),
    OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    OTP_HASH_PEPPER: z.string().min(1, "OTP_HASH_PEPPER is required"),

    ASSESSMENT_FIXED_OTP_ENABLED: boolEnv("false"),
    ASSESSMENT_CONFIRMATION_TOKEN: z.string().default(""),
    ASSESSMENT_EXPORT_DIR: z.string().default("./artifacts"),
    // Which email set the assessment seed uses for verified students:
    // "test" -> student{NN}@qa.local ; "real" -> {studentId}@tsu.ac.th
    ASSESSMENT_EMAIL_MODE: z.enum(["test", "real"]).default("test"),
    ASSESSMENT_REAL_EMAIL_DOMAIN: z.string().default("tsu.ac.th"),

    LOG_LEVEL: z
      .enum(["debug", "info", "warn", "error"])
      .default("info"),
  })
  // Production safety: fixed assessment OTP must never be enabled in production.
  .refine(
    (e) => !(e.APP_MODE === "production" && e.ASSESSMENT_FIXED_OTP_ENABLED),
    {
      message:
        "ASSESSMENT_FIXED_OTP_ENABLED must be false when APP_MODE=production",
      path: ["ASSESSMENT_FIXED_OTP_ENABLED"],
    },
  );

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === "production";
export const isAssessmentMode = env.APP_MODE === "assessment";
