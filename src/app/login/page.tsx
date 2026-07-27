"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import { TextField, Button, Alert } from "@/components/ui";
import { signIn } from "@/lib/auth-client";
import { apiGet } from "@/lib/api";

type Me = { role: "STUDENT" | "STAFF" | "ADMIN" };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error: signInError } = await signIn.email({ email, password });
      if (signInError) {
        setError("Invalid email or password.");
        return;
      }
      // Honor an explicit ?next= (e.g. a check-in deep link); else route by role.
      const next = new URLSearchParams(window.location.search).get("next");
      let dest = next;
      if (!dest) {
        const me = await apiGet<Me>("/api/students/me");
        dest = me.role === "STUDENT" ? "/student/dashboard" : "/admin/dashboard";
      }
      router.push(dest);
      router.refresh();
    } catch {
      setError("Unable to sign in right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to check in and view your activities."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-semibold text-[color:var(--text)]">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}
        <TextField
          label="Email"
          type="email"
          placeholder="you@student.university.ac.th"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" fullWidth loading={submitting}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
