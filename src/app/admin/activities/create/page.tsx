"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui";
import {
  ActivityForm,
  type ActivityFormValues,
} from "@/components/activity-form";
import { apiPost } from "@/lib/api";
import type { ActivitySummary } from "@/lib/types";

export default function CreateActivityPage() {
  const router = useRouter();

  async function onSubmit(v: ActivityFormValues) {
    const created = await apiPost<ActivitySummary>("/api/activities", {
      title: v.title,
      description: v.description || undefined,
      location: v.location,
      activityDate: v.activityDate,
      startTime: v.startTime,
      endTime: v.endTime,
    });
    router.push(`/admin/activities/${created.id}/qr`);
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
        <h1 className="text-2xl font-bold">New activity</h1>
        <p className="mt-1 text-sm text-muted">
          It starts as a draft. Open it when you’re ready for check-ins.
        </p>
        <div className="mt-6">
          <ActivityForm submitLabel="Create activity" onSubmit={onSubmit} />
        </div>
      </GlassCard>
    </div>
  );
}
