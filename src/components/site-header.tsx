import Link from "next/link";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme";

// Public marketing/auth header.
export function SiteHeader({ showAuthLinks = true }: { showAuthLinks?: boolean }) {
  return (
    <header className="sticky top-0 z-30">
      <div className="glass mx-auto mt-3 flex max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 sm:px-5">
        <Brand />
        <div className="flex items-center gap-2">
          {showAuthLinks && (
            <>
              <Link
                href="/login"
                className="hidden rounded-xl px-3 py-2 text-sm font-medium hover:bg-black/5 sm:inline-block dark:hover:bg-white/10"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-cyan to-indigo px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan/20 transition hover:brightness-110"
              >
                Register
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
