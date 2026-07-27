"use client";
import * as React from "react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme";
import { GlassCard, Button, Spinner, Alert, Badge } from "@/components/ui";
import { ActivityStatusBadge } from "@/components/status";
import { fmtDate, fmtTimeRange } from "@/lib/format";
import { useSession } from "@/lib/auth-client";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import type { CheckinSummary } from "@/lib/types";

type CheckinDone = {
  checkedIn: boolean;
  checkinTime: string;
  activity: { activityCode: string; title: string; location: string };
};

export default function CheckinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = React.use(params);
  const { data: session, isPending: sessionPending } = useSession();

  const [summary, setSummary] = React.useState<CheckinSummary | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<CheckinDone | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (sessionPending) return;
    if (!session) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const data = await apiGet<CheckinSummary>(`/api/checkin/${token}`);
        if (active) setSummary(data);
      } catch (err) {
        if (active)
          setLoadError(
            err instanceof ApiError ? err.message : "Could not load activity.",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [session, sessionPending, token]);

  async function confirm() {
    setSubmitting(true);
    setActionError(null);
    try {
      const data = await apiPost<CheckinDone>(`/api/checkin/${token}`);
      setResult(data);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Check-in failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">
      <header className="flex items-center justify-between py-4">
        <Brand />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col justify-center pb-10">
        {loading || sessionPending ? (
          <div className="flex justify-center py-20">
            <Spinner className="h-8 w-8 text-cyan" />
          </div>
        ) : !session ? (
          <GlassCard strong className="p-6 text-center">
            <div className="text-4xl">🔐</div>
            <h1 className="mt-3 text-xl font-bold">Sign in to check in</h1>
            <p className="mt-1.5 text-sm text-muted">
              You need to be signed in as a verified student to check in.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent(`/checkin/${token}`)}`}
              className="mt-5 inline-block w-full rounded-xl bg-gradient-to-r from-cyan to-indigo px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan/25"
            >
              Sign in
            </Link>
          </GlassCard>
        ) : result ? (
          <GlassCard strong className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-4xl ring-2 ring-success/40">
              ✓
            </div>
            <h1 className="mt-4 text-2xl font-bold">Checked in!</h1>
            <p className="mt-1.5 text-sm text-muted">
              {result.activity.title} · {result.activity.location}
            </p>
            <p className="mt-4 text-xs text-muted">
              {new Date(result.checkinTime).toLocaleString()}
            </p>
            <Link
              href="/student/history"
              className="mt-6 inline-block w-full rounded-xl glass px-4 py-3 text-sm font-semibold"
            >
              View my history
            </Link>
          </GlassCard>
        ) : loadError ? (
          <GlassCard strong className="p-8 text-center">
            <div className="text-4xl">🚫</div>
            <h1 className="mt-3 text-xl font-bold">Can’t check in</h1>
            <p className="mt-2 text-sm text-muted">{loadError}</p>
            <Link
              href="/student/dashboard"
              className="mt-5 inline-block text-sm font-semibold text-[color:var(--text)]"
            >
              Back to dashboard
            </Link>
          </GlassCard>
        ) : summary ? (
          <GlassCard strong className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">
                {summary.activity.activityCode}
              </span>
              <ActivityStatusBadge status={summary.activity.status} />
            </div>
            <h1 className="mt-2 text-2xl font-bold">{summary.activity.title}</h1>
            {summary.activity.description && (
              <p className="mt-1.5 text-sm text-muted">
                {summary.activity.description}
              </p>
            )}
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">📍 Location</dt>
                <dd className="font-medium">{summary.activity.location}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">🗓️ Date</dt>
                <dd className="font-medium">
                  {fmtDate(summary.activity.activityDate)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">⏰ Time</dt>
                <dd className="font-medium">
                  {fmtTimeRange(
                    summary.activity.startTime,
                    summary.activity.endTime,
                  )}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              {actionError && (
                <div className="mb-3">
                  <Alert variant="error">{actionError}</Alert>
                </div>
              )}
              {summary.alreadyCheckedIn ? (
                <div className="text-center">
                  <Badge tone="success">Already checked in</Badge>
                </div>
              ) : (
                <Button
                  fullWidth
                  loading={submitting}
                  onClick={confirm}
                  className="py-3.5 text-base"
                >
                  Confirm check-in
                </Button>
              )}
            </div>
          </GlassCard>
        ) : null}
      </main>
    </div>
  );
}
