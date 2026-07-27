import * as React from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------- Glass card ------------------------------- */
export function GlassCard({
  className,
  strong,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { strong?: boolean }) {
  return (
    <div
      className={cx(
        strong ? "glass-strong" : "glass",
        "rounded-2xl",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* --------------------------------- Spinner -------------------------------- */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="loading"
      className={cx(
        "inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin-slow",
        className,
      )}
    />
  );
}

/* --------------------------------- Button --------------------------------- */
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "text-white bg-gradient-to-r from-cyan to-indigo shadow-lg shadow-cyan/20 hover:brightness-110 border border-white/10",
  secondary:
    "glass hover:brightness-105 border-white/10 text-[color:var(--text)]",
  ghost:
    "bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-[color:var(--text)]",
  danger:
    "text-white bg-error/90 hover:bg-error border border-white/10 shadow-lg shadow-error/20",
};

export function Button({
  variant = "primary",
  loading,
  fullWidth,
  className,
  children,
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold",
        "transition disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60",
        buttonVariants[variant],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

/* ------------------------------- Text field ------------------------------- */
export const TextField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
    hint?: string;
  }
>(function TextField({ label, error, hint, className, id, ...rest }, ref) {
  const fieldId = id ?? rest.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={fieldId}
          className="mb-1.5 block text-sm font-medium"
        >
          {label}
        </label>
      )}
      <input
        id={fieldId}
        ref={ref}
        aria-invalid={Boolean(error)}
        className={cx(
          "field w-full rounded-xl px-3.5 py-2.5 text-sm transition",
          error && "!border-error focus:!ring-error/30",
          className,
        )}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-error">
          <span aria-hidden>⚠</span>
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
});

/* ------------------------------ Select field ------------------------------ */
export const SelectField = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    error?: string;
  }
>(function SelectField({ label, error, className, id, children, ...rest }, ref) {
  const fieldId = id ?? rest.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium">
          {label}
        </label>
      )}
      <select
        id={fieldId}
        ref={ref}
        className={cx(
          "field w-full rounded-xl px-3.5 py-2.5 text-sm transition",
          error && "!border-error",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1.5 text-xs font-medium text-error">{error}</p>
      )}
    </div>
  );
});

/* --------------------------------- Badge ---------------------------------- */
type Tone = "cyan" | "indigo" | "success" | "warning" | "error" | "muted";

const toneStyles: Record<Tone, string> = {
  cyan: "bg-cyan/15 text-[color:var(--text)] ring-cyan/40",
  indigo: "bg-indigo/15 text-[color:var(--text)] ring-indigo/40",
  success: "bg-success/15 text-[color:var(--text)] ring-success/40",
  warning: "bg-warning/15 text-[color:var(--text)] ring-warning/40",
  error: "bg-error/15 text-[color:var(--text)] ring-error/40",
  muted: "bg-muted/15 text-[color:var(--text)] ring-muted/40",
};

const dotColor: Record<Tone, string> = {
  cyan: "bg-cyan",
  indigo: "bg-indigo",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  muted: "bg-muted",
};

export function Badge({
  tone = "muted",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        toneStyles[tone],
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", dotColor[tone])} aria-hidden />
      {children}
    </span>
  );
}

/* --------------------------------- Alert ---------------------------------- */
type AlertVariant = "success" | "error" | "info" | "warning";

const alertStyles: Record<AlertVariant, { ring: string; icon: string }> = {
  success: { ring: "ring-success/40 bg-success/10", icon: "✓" },
  error: { ring: "ring-error/40 bg-error/10", icon: "⚠" },
  info: { ring: "ring-cyan/40 bg-cyan/10", icon: "ℹ" },
  warning: { ring: "ring-warning/40 bg-warning/10", icon: "!" },
};

export function Alert({
  variant = "info",
  title,
  children,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
}) {
  const s = alertStyles[variant];
  return (
    <div
      role="alert"
      className={cx(
        "flex gap-3 rounded-xl px-4 py-3 text-sm ring-1 ring-inset",
        s.ring,
      )}
    >
      <span aria-hidden className="mt-0.5 font-bold">
        {s.icon}
      </span>
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-muted">{children}</div>}
      </div>
    </div>
  );
}
