"use client";
import * as React from "react";
import { useApi } from "@/lib/use-api";
import { GlassCard, Spinner, Alert, Button } from "@/components/ui";
import { RoleBadge, StudentStatusBadge } from "@/components/status";
import { apiPatch, ApiError } from "@/lib/api";
import type { AdminUser, Role } from "@/lib/types";

export default function UsersPage() {
  const { data, loading, error, reload } =
    useApi<AdminUser[]>("/api/admin/users");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  async function run(fn: () => Promise<unknown>, id: string) {
    setBusyId(id);
    setActionError(null);
    try {
      await fn();
      await reload();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Action failed.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-muted">
          Manage roles and student account status.
        </p>
      </div>

      {actionError && <Alert variant="error">{actionError}</Alert>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8 text-cyan" />
        </div>
      ) : error ? (
        <Alert variant="error">{error.message}</Alert>
      ) : data ? (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted">
                <tr className="border-b hairline">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Student ID</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u.id} className="border-b hairline last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.name ?? "—"}</div>
                      <div className="text-xs text-muted">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted">
                      {u.studentProfile?.studentId ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <RoleBadge role={u.role} />
                        <select
                          className="field rounded-lg px-2 py-1 text-xs"
                          value={u.role}
                          disabled={busyId === u.id}
                          onChange={(e) =>
                            run(
                              () =>
                                apiPatch(`/api/admin/users/${u.id}/role`, {
                                  role: e.target.value as Role,
                                }),
                              u.id,
                            )
                          }
                        >
                          <option value="STUDENT">STUDENT</option>
                          <option value="STAFF">STAFF</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.studentProfile ? (
                        <StudentStatusBadge status={u.studentProfile.status} />
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.studentProfile &&
                        (u.studentProfile.status === "SUSPENDED" ? (
                          <Button
                            variant="secondary"
                            className="px-3 py-1.5"
                            loading={busyId === u.id}
                            onClick={() =>
                              run(
                                () =>
                                  apiPatch(
                                    `/api/admin/users/${u.id}/status`,
                                    { status: "ACTIVE" },
                                  ),
                                u.id,
                              )
                            }
                          >
                            Activate
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            className="px-3 py-1.5"
                            loading={busyId === u.id}
                            onClick={() =>
                              run(
                                () =>
                                  apiPatch(
                                    `/api/admin/users/${u.id}/status`,
                                    { status: "SUSPENDED" },
                                  ),
                                u.id,
                              )
                            }
                          >
                            Suspend
                          </Button>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}
