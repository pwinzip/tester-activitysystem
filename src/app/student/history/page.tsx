"use client";
import { useApi } from "@/lib/use-api";
import { GlassCard, Spinner, Alert } from "@/components/ui";
import { fmtDate, fmtDateTime } from "@/lib/format";
import type { AttendanceRecord } from "@/lib/types";

export default function HistoryPage() {
  const { data, loading, error } = useApi<AttendanceRecord[]>(
    "/api/students/me/attendance",
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">My attendance history</h1>
        <p className="mt-1 text-sm text-muted">
          Every activity you have checked in to.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8 text-cyan" />
        </div>
      ) : error ? (
        <Alert variant="error">{error.message}</Alert>
      ) : data && data.length > 0 ? (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted">
                <tr className="border-b hairline">
                  <th className="px-4 py-3 font-medium">Activity</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Checked in</th>
                </tr>
              </thead>
              <tbody>
                {data.map((a) => (
                  <tr key={a.id} className="border-b hairline last:border-0">
                    <td className="px-4 py-3 font-medium">{a.activity.title}</td>
                    <td className="px-4 py-3 text-muted">
                      {a.activity.activityCode}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {fmtDate(a.activity.activityDate)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {fmtDateTime(a.checkinTime)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-10 text-center text-sm text-muted">
          You haven’t checked in to any activities yet.
        </GlassCard>
      )}
    </div>
  );
}
