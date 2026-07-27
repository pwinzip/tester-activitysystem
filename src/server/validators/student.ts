import { z } from "zod";
import { validateStudentId } from "@/server/services/student-id";

export const registerSchema = z
  .object({
    studentId: z.string(),
    fullName: z.string().trim().min(1, "Full name is required"),
    email: z.email(),
    major: z.string().trim().min(1, "Major is required"),
    yearLevel: z.coerce.number().int().min(1).max(8),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .superRefine((d, ctx) => {
    // Reuse the white-box validator so its coded result reaches the client.
    const result = validateStudentId(d.studentId);
    if (result !== "VALID") {
      ctx.addIssue({ code: "custom", path: ["studentId"], message: result });
    }
    if (d.password !== d.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const verifyEmailSchema = z.object({
  email: z.email(),
  // OTP length boundary (spec §26.2): 5 reject, 6 accept, 7 reject.
  otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendOtpSchema = z.object({
  email: z.email(),
});

export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
