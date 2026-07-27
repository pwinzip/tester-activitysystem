"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme";
import { signOut } from "@/lib/auth-client";
import { cx } from "./ui";

export interface NavItem {
  href: string;
  label: string;
}

export function AppShell({
  nav,
  userLabel,
  children,
}: {
  nav: NavItem[];
  userLabel?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-3 sm:px-5">
      <header className="glass sticky top-3 z-30 mt-3 flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5">
        <div className="flex items-center gap-5">
          <Brand href={nav[0]?.href ?? "/"} />
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                    active
                      ? "bg-cyan/15 text-[color:var(--text)] ring-1 ring-inset ring-cyan/40"
                      : "text-muted hover:bg-black/5 dark:hover:bg-white/10",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {userLabel && (
            <span className="hidden max-w-[14ch] truncate text-xs text-muted sm:inline">
              {userLabel}
            </span>
          )}
          <ThemeToggle />
          <button
            onClick={handleSignOut}
            className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="mt-2 flex gap-1 overflow-x-auto md:hidden">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition",
                active
                  ? "bg-cyan/15 ring-1 ring-inset ring-cyan/40"
                  : "text-muted",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 py-5">{children}</main>

      <footer className="py-5 text-center text-xs text-muted">
        SciDI Activity Check-in System
      </footer>
    </div>
  );
}
