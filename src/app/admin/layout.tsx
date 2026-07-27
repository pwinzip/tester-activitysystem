"use client";
import { useSession } from "@/lib/auth-client";
import { GuardedShell } from "@/components/guarded-shell";
import type { Role } from "@/lib/types";

const baseNav = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/activities", label: "Activities" },
];
const adminNav = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit-logs", label: "Audit Logs" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = useSession();
  const role = (data?.user as { role?: Role } | undefined)?.role;
  const nav = role === "ADMIN" ? [...baseNav, ...adminNav] : baseNav;

  return (
    <GuardedShell nav={nav} allow={["STAFF", "ADMIN"]}>
      {children}
    </GuardedShell>
  );
}
