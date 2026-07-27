"use client";
import * as React from "react";

// Inline script runs before paint to prevent a theme flash.
export const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var c=document.documentElement.classList;var dark=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;c.toggle('dark',dark);c.toggle('light',!dark);}catch(e){}})();`;

function currentIsDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // Sync UI to the class the pre-paint script already applied (client-only).
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setDark(currentIsDark());
    setMounted(true);
  }, []);

  function toggle() {
    const next = !currentIsDark();
    const c = document.documentElement.classList;
    c.toggle("dark", next);
    c.toggle("light", !next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // ignore storage errors
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={
        "glass inline-flex h-9 w-9 items-center justify-center rounded-full text-base transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60 " +
        (className ?? "")
      }
    >
      {mounted ? (dark ? "☀️" : "🌙") : "🌓"}
    </button>
  );
}
