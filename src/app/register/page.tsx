"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AuthLayout } from "@/components/auth-layout";
import { TextField, SelectField, Button, Alert } from "@/components/ui";
import { apiPost, ApiError } from "@/lib/api";

type FormValues = {
  studentId: string;
  fullName: string;
  email: string;
  major: string;
  yearLevel: string;
  password: string;
  confirmPassword: string;
};

const studentIdMessages: Record<string, string> = {
  STUDENT_ID_REQUIRED: "Student ID is required.",
  STUDENT_ID_MUST_BE_NUMERIC: "Student ID must contain digits only.",
  STUDENT_ID_MUST_BE_10_DIGITS: "Student ID must be exactly 10 digits.",
};

export default function RegisterPage() {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await apiPost("/api/students/register", {
        ...values,
        yearLevel: Number(values.yearLevel),
      });
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.details.length) {
          for (const d of err.details) {
            if (d.field) {
              setError(d.field as keyof FormValues, {
                message: studentIdMessages[d.message] ?? d.message,
              });
            }
          }
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError("Unable to register right now.");
      }
    }
  }

  return (
    <AuthLayout
      wide
      title="Create your account"
      subtitle="Register with your student ID and university email."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[color:var(--text)]">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Student ID"
            placeholder="6612345678"
            inputMode="numeric"
            autoComplete="username"
            error={errors.studentId?.message}
            {...register("studentId")}
          />
          <TextField
            label="Full name"
            placeholder="Jane Doe"
            error={errors.fullName?.message}
            {...register("fullName", { required: "Full name is required." })}
          />
        </div>

        <TextField
          label="University email"
          type="email"
          placeholder="you@student.university.ac.th"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email", { required: "Email is required." })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Major"
            placeholder="Computer Science"
            error={errors.major?.message}
            {...register("major", { required: "Major is required." })}
          />
          <SelectField
            label="Year level"
            defaultValue="1"
            error={errors.yearLevel?.message}
            {...register("yearLevel")}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password", { required: "Password is required." })}
          />
          <TextField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword", {
              required: "Please confirm your password.",
            })}
          />
        </div>

        <Button type="submit" fullWidth loading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
