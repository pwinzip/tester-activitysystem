"use client";
import * as React from "react";
import Link from "next/link";
import { useApi } from "@/lib/use-api";
import { GlassCard, Spinner, Alert, Button } from "@/components/ui";
import { ActivityStatusBadge } from "@/components/status";
import { fmtDate, fmtTimeRange } from "@/lib/format";
import { apiPatch, ApiError } from "@/lib/api";
import type { ActivitySummary, ActivityStatus } from "@/lib/types";

const nextStatuses: Record<ActivityStatus, ActivityStatus[]> = {
  DRAFT: ["OPEN", "CANCELLED"],
  OPEN: ["CLOSED", "CANCELLED"],
  CLOSED: [],
  CANCELLED: [],
};

export default function ActivitiesPage() {
  const { data, loading, error, reload } =
    useApi<ActivitySummary[]>("/api/activities");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  async function changeStatus(id: string, status: ActivityStatus) {
    setBusyId(id);
    setActionError(null);
    try {
      await apiPatch(`/api/activities/${id}/status`, { status });
      await reload();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to update status.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Activities</h1>
        <Link
          href="/admin/activities/create"
          className="rounded-xl bg-gradient-to-r from-cyan to-indigo px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan/25 transition hover:brightness-110"
        >
          + New activity
        </Link>
      </div>

      {actionError && <Alert variant="error">{actionError}</Alert>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8 text-cyan" />
        </div>
      ) : error ? (
        <Alert variant="error">{error.message}</Alert>
      ) : data && data.length > 0 ? (
        <div className="grid gap-3">
          {data.map((a) => (
            <GlassCard key={a.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{a.title}</h3>
                    <ActivityStatusBadge status={a.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{a.activityCode}</p>
                  <p className="mt-2 text-sm text-muted">
                    📍 {a.location} · 🗓️ {fmtDate(a.activityDate)} ·{" "}
                    {fmtTimeRange(a.startTime, a.endTime)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t hairline pt-4">
                <Link
                  href={`/admin/activities/${a.id}/qr`}
                  className="glass rounded-lg px-3 py-1.5 text-sm font-medium hover:brightness-105"
                >
                  QR
                </Link>
                <Link
                  href={`/admin/activities/${a.id}/participants`}
                  className="glass rounded-lg px-3 py-1.5 text-sm font-medium hover:brightness-105"
                >
                  Participants
                </Link>
                {(a.status === "DRAFT" || a.status === "OPEN") && (
                  <Link
                    href={`/admin/activities/${a.id}/edit`}
                    className="glass rounded-lg px-3 py-1.5 text-sm font-medium hover:brightness-105"
                  >
                    Edit
                  </Link>
                )}
                <div className="grow" />
                {nextStatuses[a.status].map((s) => (
                  <Button
                    key={s}
                    variant={s === "CANCELLED" ? "danger" : "primary"}
                    loading={busyId === a.id}
                    onClick={() => changeStatus(a.id, s)}
                    className="px-3 py-1.5"
                  >
                    {s === "OPEN"
                      ? "Open"
                      : s === "CLOSED"
                        ? "Close"
                        : "Cancel"}
                  </Button>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="p-10 text-center text-sm text-muted">
          No activities yet.{" "}
          <Link
            href="/admin/activities/create"
            className="font-semibold text-[color:var(--text)]"
          >
            Create one
          </Link>
          .
        </GlassCard>
      )}
    </div>
  );
}
