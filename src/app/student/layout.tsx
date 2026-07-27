"use client";
import { GuardedShell } from "@/components/guarded-shell";

const nav = [
  { href: "/student/dashboard", label: "Dashboard" },
  { href: "/student/history", label: "My History" },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuardedShell nav={nav} allow={["STUDENT", "STAFF", "ADMIN"]}>
      {children}
    </GuardedShell>
  );
}
