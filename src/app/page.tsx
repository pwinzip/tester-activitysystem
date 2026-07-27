import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { GlassCard } from "@/components/ui";

const features = [
  {
    icon: "📲",
    title: "QR Check-in",
    body: "Scan a unique activity QR code and check in within seconds — mobile first.",
  },
  {
    icon: "✉️",
    title: "Verified Students",
    body: "Register with your student ID and university email, confirmed by a 6-digit OTP.",
  },
  {
    icon: "🛡️",
    title: "Secure by Design",
    body: "Backend-enforced roles, hashed secrets, and duplicate-proof attendance.",
  },
  {
    icon: "📊",
    title: "Live Reports",
    body: "Staff view and export attendance; students track their own history.",
  },
];

const steps = [
  { n: "1", t: "Register & verify", d: "Create your account and confirm your email OTP." },
  { n: "2", t: "Scan the QR", d: "Open the activity check-in link from the QR code." },
  { n: "3", t: "You're checked in", d: "Attendance is recorded instantly — no duplicates." },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-5">
      <SiteHeader />

      <main className="py-12 sm:py-20">
        <section className="mx-auto max-w-3xl text-center">
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Faculty attendance, reimagined
          </span>
          <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight sm:text-6xl">
            Check in to activities with a{" "}
            <span className="bg-gradient-to-r from-cyan to-indigo bg-clip-text text-transparent">
              single scan
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted sm:text-lg">
            SciDI Activity Check-in System makes attendance fast, verifiable, and
            secure — for students, staff, and administrators.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-cyan to-indigo px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan/25 transition hover:brightness-110"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="glass rounded-xl px-5 py-3 text-sm font-semibold transition hover:brightness-105"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <GlassCard key={f.title} className="p-5">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{f.body}</p>
            </GlassCard>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="text-center text-2xl font-bold">How it works</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {steps.map((s) => (
              <GlassCard key={s.n} className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-cyan to-indigo text-lg font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mt-4 font-semibold">{s.t}</h3>
                <p className="mt-1.5 text-sm text-muted">{s.d}</p>
              </GlassCard>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t hairline py-8 text-center text-xs text-muted">
        <p>SciDI Activity Check-in System · Faculty of Science</p>
      </footer>
    </div>
  );
}
