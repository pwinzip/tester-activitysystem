"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import { TextField, Button, Alert } from "@/components/ui";
import { apiPost, ApiError } from "@/lib/api";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [resending, setResending] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get("email");
    // Prefill from the query string on mount (reads a browser API).
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    if (e) setEmail(e);
  }, []);

  async function onVerify(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      await apiPost("/api/students/verify-email", { email, otp });
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      const res = await apiPost<{ message: string }>(
        "/api/students/resend-otp",
        { email },
      );
      setInfo(res.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not resend code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the 6-digit code we sent to your email."
      footer={
        <>
          Wrong email?{" "}
          <Link href="/register" className="font-semibold text-[color:var(--text)]">
            Register again
          </Link>
        </>
      }
    >
      {done ? (
        <Alert variant="success" title="Email verified!">
          Redirecting you to sign in…
        </Alert>
      ) : (
        <form onSubmit={onVerify} className="space-y-4" noValidate>
          {error && <Alert variant="error">{error}</Alert>}
          {info && <Alert variant="info">{info}</Alert>}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <TextField
            label="Verification code"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="text-center text-2xl font-mono tracking-[0.5em]"
            hint="The code expires 10 minutes after it is sent."
          />

          <Button type="submit" fullWidth loading={submitting} disabled={otp.length !== 6}>
            Verify email
          </Button>
          <Button
            type="button"
            variant="ghost"
            fullWidth
            loading={resending}
            onClick={onResend}
          >
            Resend code
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
