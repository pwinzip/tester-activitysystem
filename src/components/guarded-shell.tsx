"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { AppShell, type NavItem } from "./app-shell";
import { Spinner } from "./ui";
import type { Role } from "@/lib/types";

function CenterSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner className="h-8 w-8 text-cyan" />
    </div>
  );
}

export function GuardedShell({
  nav,
  allow,
  children,
}: {
  nav: NavItem[];
  allow: Role[];
  children: React.ReactNode;
}) {
  const { data, isPending } = useSession();
  const router = useRouter();

  const role = data
    ? ((data.user as { role?: Role }).role ?? "STUDENT")
    : undefined;

  React.useEffect(() => {
    if (isPending) return;
    if (!data) {
      router.replace("/login");
      return;
    }
    if (role && !allow.includes(role)) {
      router.replace(
        role === "STUDENT" ? "/student/dashboard" : "/admin/dashboard",
      );
    }
  }, [isPending, data, role, allow, router]);

  if (isPending || !data || !role || !allow.includes(role)) {
    return <CenterSpinner />;
  }

  return (
    <AppShell nav={nav} userLabel={data.user.email}>
      {children}
    </AppShell>
  );
}
