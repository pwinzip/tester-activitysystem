import Link from "next/link";
import { SiteHeader } from "./site-header";
import { GlassCard } from "./ui";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-3 sm:px-5">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center py-8">
        <GlassCard
          strong
          className={`w-full ${wide ? "max-w-lg" : "max-w-md"} p-6 sm:p-8`}
        >
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && (
            <div className="mt-6 border-t hairline pt-4 text-center text-sm text-muted">
              {footer}
            </div>
          )}
        </GlassCard>
      </main>
      <footer className="py-5 text-center text-xs text-muted">
        <Link href="/" className="hover:text-[color:var(--text)]">
          ← Back to home
        </Link>
      </footer>
    </div>
  );
}
