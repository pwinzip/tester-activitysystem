"use client";
import * as React from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useApi } from "@/lib/use-api";
import { GlassCard, Spinner, Alert, Button } from "@/components/ui";
import { ActivityStatusBadge } from "@/components/status";
import type { QrInfo } from "@/lib/types";

export default function QrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { data, loading, error } = useApi<QrInfo>(`/api/activities/${id}/qr`);
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.checkinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
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
        <GlassCard strong className="p-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-bold">{data.title}</h1>
            <ActivityStatusBadge status={data.status} />
          </div>
          <p className="mt-1 text-xs text-muted">{data.activityCode}</p>

          {/* QR must always render on a pure white background (spec §12). */}
          <div className="qr-surface mx-auto mt-5 w-fit rounded-2xl p-5 shadow-lg">
            <QRCodeSVG value={data.checkinUrl} size={224} level="M" />
          </div>

          {data.status !== "OPEN" && (
            <p className="mt-4 text-xs font-medium text-warning">
              This activity is {data.status}. Students can only check in while it
              is OPEN.
            </p>
          )}

          <div className="mt-5 rounded-xl field px-3 py-2 text-left text-xs break-all">
            {data.checkinUrl}
          </div>
          <div className="mt-3">
            <Button variant="secondary" fullWidth onClick={copy}>
              {copied ? "Copied ✓" : "Copy check-in link"}
            </Button>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}
