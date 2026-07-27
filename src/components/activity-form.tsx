"use client";
import * as React from "react";
import { TextField, Button, Alert } from "./ui";
import { ApiError } from "@/lib/api";

export interface ActivityFormValues {
  title: string;
  description: string;
  activityDate: string; // yyyy-mm-dd
  startTime: string; // datetime-local
  endTime: string; // datetime-local
  location: string;
}

export function ActivityForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<ActivityFormValues>;
  submitLabel: string;
  onSubmit: (values: ActivityFormValues) => Promise<void>;
}) {
  const [values, setValues] = React.useState<ActivityFormValues>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    activityDate: initial?.activityDate ?? "",
    startTime: initial?.startTime ?? "",
    endTime: initial?.endTime ?? "",
    location: initial?.location ?? "",
  });
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string>
  >({});
  const [submitting, setSubmitting] = React.useState(false);

  function set<K extends keyof ActivityFormValues>(
    key: K,
    v: ActivityFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.details.length) {
          const fe: Record<string, string> = {};
          for (const d of err.details) if (d.field) fe[d.field] = d.message;
          setFieldErrors(fe);
        } else {
          setError(err.message);
        }
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <TextField
        label="Title"
        placeholder="Orientation Day"
        value={values.title}
        onChange={(e) => set("title", e.target.value)}
        error={fieldErrors.title}
        required
      />
      <TextField
        label="Description (optional)"
        placeholder="Short description"
        value={values.description}
        onChange={(e) => set("description", e.target.value)}
        error={fieldErrors.description}
      />
      <TextField
        label="Location"
        placeholder="Auditorium"
        value={values.location}
        onChange={(e) => set("location", e.target.value)}
        error={fieldErrors.location}
        required
      />
      <TextField
        label="Activity date"
        type="date"
        value={values.activityDate}
        onChange={(e) => set("activityDate", e.target.value)}
        error={fieldErrors.activityDate}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Start time"
          type="datetime-local"
          value={values.startTime}
          onChange={(e) => set("startTime", e.target.value)}
          error={fieldErrors.startTime}
          required
        />
        <TextField
          label="End time"
          type="datetime-local"
          value={values.endTime}
          onChange={(e) => set("endTime", e.target.value)}
          error={fieldErrors.endTime}
          required
        />
      </div>

      <Button type="submit" fullWidth loading={submitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
