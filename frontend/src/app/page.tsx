"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CountUp } from "@/components/ui/CountUp";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useHistory } from "@/lib/history";
import { summarize } from "@/lib/stats";
import { fmtKg } from "@/lib/utils";

const EXAMPLES = [
  "Going from Mohali to Delhi",
  "Building a 2 storey house in Mohali",
  "Team offsite for 12 people in Goa",
  "Running the AC for 6 hours in Mumbai",
];

const WAYS: { href: string; icon: IconName; title: string; text: string; tag: string }[] = [
  {
    href: "/ai",
    icon: "sparkle",
    tag: "Decide",
    title: "Predict any decision",
    text: "Trips, meals, appliances, construction, events. See the footprint and the better option before you commit.",
  },
  {
    href: "/meeting",
    icon: "pin",
    tag: "Decide together",
    title: "Find the greenest meeting point",
    text: "Tell us where everyone's coming from. We compare venues by everyone's real journeys and hotel nights.",
  },
  {
    href: "/net-zero",
    icon: "target",
    tag: "Plan",
    title: "Map your path to net zero",
    text: "Every change priced per tonne, cheapest first, on a marginal abatement cost curve and a year-by-year plan.",
  },
];

const STEPS = [
  { title: "Describe it", text: "In plain words, or by voice. A few words are enough; we tell you what would make it more accurate." },
  { title: "We calculate it", text: "AI reads your plan; every number comes from official data, and every line shows its source." },
  { title: "Shift it", text: "Compare options on a map, pick the better one, and watch your real savings grow." },
];

const SOURCES = ["CEA India", "Google Travel Impact Model", "UK DESNZ", "OpenRouteService", "Ember", "Electricity Maps"];

/** Leaves drifting across the hero. */
function Leaves() {
  const leaves = [
    { left: "8%", top: "18%", size: 26, delay: "0s", rot: 20 },
    { left: "84%", top: "14%", size: 34, delay: "-3s", rot: -30 },
    { left: "72%", top: "62%", size: 22, delay: "-6s", rot: 60 },
    { left: "18%", top: "70%", size: 18, delay: "-1.5s", rot: -10 },
    { left: "52%", top: "8%", size: 16, delay: "-4.5s", rot: 35 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {leaves.map((l, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="animate-drift absolute"
          style={{ left: l.left, top: l.top, width: l.size, height: l.size, animationDelay: l.delay, rotate: `${l.rot}deg` }}
        >
          <path d="M4 20C4 11 10 4 20 4c0 10-6 16-16 16z" fill="#c8e88a" opacity="0.5" />
          <path d="M4 20C8 14 12 10 17 7" stroke="#0f2a1f" strokeWidth="1.2" opacity="0.4" fill="none" />
        </svg>
      ))}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const history = useHistory();
  const [prompt, setPrompt] = useState("");
  const summary = history && history.length > 0 ? summarize(history) : null;

  function go(text: string) {
    const q = text.trim();
    if (q.length >= 5) router.push(`/ai?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="animate-rise relative overflow-hidden rounded-[2rem] bg-forest px-6 pb-10 pt-12 text-white shadow-2xl md:px-12 md:pb-14 md:pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(200,232,138,0.25),transparent_45%),radial-gradient(circle_at_10%_100%,rgba(47,143,91,0.55),transparent_55%)]" aria-hidden />
        <svg viewBox="0 0 1200 200" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-28 w-full" aria-hidden>
          <path d="M0 140 C 200 80 380 170 600 120 S 1000 60 1200 110 V200 H0Z" fill="#1f6b4a" opacity="0.45" />
          <path d="M0 170 C 260 120 460 200 720 160 S 1050 120 1200 150 V200 H0Z" fill="#2f8f5b" opacity="0.35" />
        </svg>
        <Leaves />

        <div className="relative max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-sprout backdrop-blur">
            <Icon name="leaf" className="h-3.5 w-3.5" />
            Net Zero AI · a carbon decision engine
          </p>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Shift your footprint <em className="text-sprout">before</em> it happens.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
            Most carbon tools measure what you&apos;ve already emitted. CarbonShift predicts the impact of a decision while you can
            still change it, and shows you the lower-carbon choice.
          </p>

          <form
            className="mt-8 flex flex-col gap-2 rounded-3xl bg-white/95 p-2 shadow-xl sm:flex-row sm:items-center"
            onSubmit={(e) => {
              e.preventDefault();
              go(prompt);
            }}
          >
            <label htmlFor="hero-prompt" className="sr-only">Describe a decision</label>
            <input
              id="hero-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What are you planning?"
              className="min-w-0 flex-1 rounded-2xl bg-transparent px-4 py-3 text-ink outline-none placeholder:text-ink/45"
            />
            <button
              type="submit"
              disabled={prompt.trim().length < 5}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-forest px-6 py-3 font-medium text-white transition hover:bg-moss disabled:opacity-40"
            >
              Predict
              <Icon name="arrow" className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => go(ex)}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white/85 transition hover:border-sprout hover:bg-white/10 hover:text-white"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="animate-rise flex flex-wrap items-center gap-x-6 gap-y-2 px-1 text-sm text-ink/55" style={{ animationDelay: "0.1s" }}>
        <span className="flex items-center gap-1.5 font-medium text-forest">
          <Icon name="shield" className="h-4 w-4" />
          Numbers from
        </span>
        {SOURCES.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </section>

      {/* Personal snapshot */}
      {summary && (
        <section className="animate-rise grid gap-4 rounded-3xl border border-line/80 bg-surface p-6 sm:grid-cols-4" aria-label="Your shift so far">
          <div className="sm:col-span-1">
            <p className="font-display text-xl font-semibold text-forest">Your shift so far</p>
            <Link href="/dashboard" className="mt-1 inline-flex items-center gap-1 text-sm text-fern hover:underline">
              Open dashboard <Icon name="arrow" className="h-3.5 w-3.5" />
            </Link>
          </div>
          {[
            { label: "Decisions analysed", value: summary.count, format: (n: number) => String(Math.round(n)) },
            { label: "Could avoid", value: summary.avoidableKg, format: fmtKg },
            { label: "Actually avoided", value: summary.avoidedKg, format: fmtKg },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-sm text-ink/55">{s.label}</p>
              <p className="mt-1 font-display text-3xl font-semibold text-forest">
                <CountUp value={s.value} format={s.format} />
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Three ways to shift */}
      <section>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-forest md:text-3xl">Three ways to shift</h2>
        <div className="stagger mt-5 grid gap-4 md:grid-cols-3">
          {WAYS.map((w) => (
            <Link
              key={w.href}
              href={w.href}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-line/80 bg-surface p-6 transition duration-300 hover:-translate-y-1 hover:border-fern/40 hover:shadow-[0_20px_40px_-24px_rgba(15,42,31,0.45)]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sage text-moss transition group-hover:bg-sprout group-hover:text-forest">
                <Icon name={w.icon} className="h-5 w-5" />
              </span>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-fern">{w.tag}</p>
              <h3 className="mt-1 font-display text-xl font-semibold text-forest">{w.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{w.text}</p>
              <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium text-moss">
                Start <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-[2rem] bg-sage/70 p-6 md:p-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-forest md:text-3xl">How it works</h2>
        <ol className="stagger mt-6 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <span className="font-display text-5xl font-semibold text-fern/30">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-1 font-display text-xl font-semibold text-forest">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink/70">{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 flex items-start gap-2 rounded-2xl bg-surface/80 p-4 text-sm text-ink/75">
          <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-fern" />
          The AI never invents a number. It only reads your plan; distances, flight emissions and grid factors come from official
          and open data, and each line of every result shows where it came from.
        </p>
      </section>
    </div>
  );
}
