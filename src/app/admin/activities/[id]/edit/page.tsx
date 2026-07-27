"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/use-api";
import { GlassCard, Spinner, Alert } from "@/components/ui";
import {
  ActivityForm,
  type ActivityFormValues,
} from "@/components/activity-form";
import { apiPatch } from "@/lib/api";
import { toDateInput, toDateTimeInput } from "@/lib/format";
import type { ActivitySummary } from "@/lib/types";

export default function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();
  const { data, loading, error } = useApi<ActivitySummary>(
    `/api/activities/${id}`,
  );

  async function onSubmit(v: ActivityFormValues) {
    await apiPatch(`/api/activities/${id}`, {
      title: v.title,
      description: v.description || undefined,
      location: v.location,
      activityDate: v.activityDate,
      startTime: v.startTime,
      endTime: v.endTime,
    });
    router.push("/admin/activities");
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link
        href="/admin/activities"
        className="text-sm text-muted hover:text-[color:var(--text)]"
      >
        ← Activities
      </Link>
      <GlassCard strong className="p-6">
        <h1 className="text-2xl font-bold">Edit activity</h1>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-7 w-7 text-cyan" />
          </div>
        ) : error ? (
          <div className="mt-4">
            <Alert variant="error">{error.message}</Alert>
          </div>
        ) : data ? (
          <div className="mt-6">
            <ActivityForm
              submitLabel="Save changes"
              onSubmit={onSubmit}
              initial={{
                title: data.title,
                description: data.description ?? "",
                location: data.location,
                activityDate: toDateInput(data.activityDate),
                startTime: toDateTimeInput(data.startTime),
                endTime: toDateTimeInput(data.endTime),
              }}
            />
          </div>
        ) : null}
      </GlassCard>
    </div>
  );
}
