"use client";
import Link from "next/link";
import { useApi } from "@/lib/use-api";
import { GlassCard, Spinner, Alert } from "@/components/ui";
import type { ActivitySummary } from "@/lib/types";

function StatTile({
  label,
  value,
  tone = "text-[color:var(--text)]",
}: {
  label: string;
  value: React.ReactNode;
  tone?: string;
}) {
  return (
    <GlassCard className="p-5">
      <div className={`text-3xl font-extrabold ${tone}`}>{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </GlassCard>
  );
}

export default function AdminDashboard() {
  const { data, loading, error } = useApi<ActivitySummary[]>("/api/activities");

  const counts = {
    total: data?.length ?? 0,
    open: data?.filter((a) => a.status === "OPEN").length ?? 0,
    draft: data?.filter((a) => a.status === "DRAFT").length ?? 0,
    closed:
      data?.filter((a) => a.status === "CLOSED" || a.status === "CANCELLED")
        .length ?? 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Manage activities and monitor attendance.
          </p>
        </div>
        <Link
          href="/admin/activities/create"
          className="rounded-xl bg-gradient-to-r from-cyan to-indigo px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan/25 transition hover:brightness-110"
        >
          + New activity
        </Link>
      </div>

      {error ? (
        <Alert variant="error">{error.message}</Alert>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8 text-cyan" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Total activities" value={counts.total} />
            <StatTile label="Open" value={counts.open} tone="text-success" />
            <StatTile label="Draft" value={counts.draft} tone="text-muted" />
            <StatTile
              label="Closed / cancelled"
              value={counts.closed}
              tone="text-indigo"
            />
          </div>

          <GlassCard className="p-6">
            <h2 className="font-semibold">Quick actions</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/admin/activities"
                className="glass rounded-xl px-4 py-2.5 text-sm font-medium hover:brightness-105"
              >
                Manage activities
              </Link>
              <Link
                href="/admin/activities/create"
                className="glass rounded-xl px-4 py-2.5 text-sm font-medium hover:brightness-105"
              >
                Create activity
              </Link>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
