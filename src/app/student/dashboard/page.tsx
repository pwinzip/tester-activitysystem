"use client";
import { useApi } from "@/lib/use-api";
import { GlassCard, Spinner, Alert } from "@/components/ui";
import { ActivityStatusBadge, StudentStatusBadge } from "@/components/status";
import { fmtDate, fmtTimeRange } from "@/lib/format";
import type { Me, ActivitySummary, AttendanceRecord } from "@/lib/types";

function StatTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <GlassCard className="p-5">
      <div className="text-3xl font-extrabold">{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </GlassCard>
  );
}

export default function StudentDashboard() {
  const me = useApi<Me>("/api/students/me");
  const activities = useApi<ActivitySummary[]>("/api/activities");
  const attendance = useApi<AttendanceRecord[]>(
    "/api/students/me/attendance",
  );

  if (me.loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8 text-cyan" />
      </div>
    );
  }

  const profile = me.data?.profile;

  return (
    <div className="space-y-6">
      <GlassCard strong className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Welcome back,</p>
            <h1 className="text-2xl font-bold">
              {profile?.fullName ?? me.data?.name ?? me.data?.email}
            </h1>
            {profile && (
              <p className="mt-1 text-sm text-muted">
                {profile.studentId} · {profile.major} · Year {profile.yearLevel}
              </p>
            )}
          </div>
          {profile && <StudentStatusBadge status={profile.status} />}
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Open activities"
          value={
            activities.loading ? (
              <Spinner />
            ) : (
              (activities.data?.length ?? 0)
            )
          }
        />
        <StatTile
          label="My check-ins"
          value={
            attendance.loading ? <Spinner /> : (attendance.data?.length ?? 0)
          }
        />
        <StatTile
          label="Email"
          value={
            <span className="text-base font-semibold">
              {me.data?.emailVerified ? "✓ Verified" : "Unverified"}
            </span>
          }
        />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Open activities</h2>
        {activities.loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="text-cyan" />
          </div>
        ) : activities.error ? (
          <Alert variant="error">{activities.error.message}</Alert>
        ) : activities.data && activities.data.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {activities.data.map((a) => (
              <GlassCard key={a.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="mt-0.5 text-xs text-muted">{a.activityCode}</p>
                  </div>
                  <ActivityStatusBadge status={a.status} />
                </div>
                <dl className="mt-3 space-y-1 text-sm text-muted">
                  <div>📍 {a.location}</div>
                  <div>
                    🗓️ {fmtDate(a.activityDate)} ·{" "}
                    {fmtTimeRange(a.startTime, a.endTime)}
                  </div>
                </dl>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard className="p-8 text-center text-sm text-muted">
            No open activities right now. Scan an activity QR code to check in.
          </GlassCard>
        )}
      </section>
    </div>
  );
}
