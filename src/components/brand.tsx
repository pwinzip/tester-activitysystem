import Link from "next/link";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <defs>
        <linearGradient id="scidiGrad" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#18D6D6" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="42" height="42" rx="12" fill="url(#scidiGrad)" />
      <rect
        x="14"
        y="14"
        width="9"
        height="9"
        rx="2"
        fill="white"
        opacity="0.95"
      />
      <rect x="25" y="14" width="9" height="9" rx="2" fill="white" opacity="0.6" />
      <rect x="14" y="25" width="9" height="9" rx="2" fill="white" opacity="0.6" />
      <rect x="25" y="25" width="9" height="9" rx="2" fill="white" opacity="0.95" />
    </svg>
  );
}

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-sm font-bold tracking-tight">SciDI Activity</span>
        <span className="text-[11px] text-muted">Check-in System</span>
      </span>
    </Link>
  );
}
