"use client";
import { useApi } from "@/lib/use-api";
import { GlassCard, Spinner, Alert, Badge } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";
import type { AuditLogRecord } from "@/lib/types";

export default function AuditLogsPage() {
  const { data, loading, error } = useApi<AuditLogRecord[]>(
    "/api/admin/audit-logs?limit=100",
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Audit logs</h1>
        <p className="mt-1 text-sm text-muted">
          Recent administrative actions.
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
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {data.map((log) => (
                  <tr key={log.id} className="border-b hairline last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {fmtDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {log.actorUser?.email ?? (
                        <span className="text-muted">system</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="indigo">{log.action}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {log.entityType}
                      {log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {log.metadata ? JSON.stringify(log.metadata) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-10 text-center text-sm text-muted">
          No audit records yet.
        </GlassCard>
      )}
    </div>
  );
}
