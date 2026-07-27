"use client";
import * as React from "react";
import Link from "next/link";
import { useApi } from "@/lib/use-api";
import { GlassCard, Spinner, Alert } from "@/components/ui";
import { ActivityStatusBadge } from "@/components/status";
import { fmtDateTime } from "@/lib/format";
import type { ParticipantsResult } from "@/lib/types";

export default function ParticipantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { data, loading, error } = useApi<ParticipantsResult>(
    `/api/activities/${id}/participants`,
  );

  return (
    <div className="space-y-4">
      <Link
        href="/admin/activities"
        className="text-sm text-muted hover:text-[color:var(--text)]"
      >
        ← Activities
      </Link>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8 text-cyan" />
        </div>
      ) : error ? (
        <Alert variant="error">{error.message}</Alert>
      ) : data ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{data.activity.title}</h1>
                <ActivityStatusBadge status={data.activity.status} />
              </div>
              <p className="mt-1 text-sm text-muted">
                {data.activity.activityCode} · {data.total}{" "}
                {data.total === 1 ? "participant" : "participants"}
              </p>
            </div>
            {data.total > 0 && (
              <a
                href={`/api/activities/${id}/export.csv`}
                download
                className="glass rounded-xl px-4 py-2.5 text-sm font-semibold hover:brightness-105"
              >
                ⬇ Export CSV
              </a>
            )}
          </div>

          {data.total > 0 ? (
            <GlassCard className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted">
                    <tr className="border-b hairline">
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Student ID</th>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Major</th>
                      <th className="px-4 py-3 font-medium">Year</th>
                      <th className="px-4 py-3 font-medium">Checked in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.participants.map((p, i) => (
                      <tr
                        key={p.id}
                        className="border-b hairline last:border-0"
                      >
                        <td className="px-4 py-3 text-muted">{i + 1}</td>
                        <td className="px-4 py-3 font-mono">
                          {p.studentProfile.studentId}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {p.studentProfile.fullName}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {p.studentProfile.major}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {p.studentProfile.yearLevel}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {fmtDateTime(p.checkinTime)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-10 text-center text-sm text-muted">
              No check-ins yet for this activity.
            </GlassCard>
          )}
        </>
      ) : null}
    </div>
  );
}
