"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CountUp } from "@/components/ui/CountUp";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useHistory } from "@/lib/history";
import { summarize } from "@/lib/stats";
import { fmtKg } from "@/lib/utils";
import { Leaves } from "@/components/ui/Leaves";

const EXAMPLES = [
  "Going from Mohali to Delhi",
  "Building a 2 storey house in Mohali",
  "Team offsite for 12 people in Goa",
  "Running the AC for 6 hours in Mumbai",
];

const WAYS: { href: string; icon: IconName; title: string; text: string }[] = [
  {
    href: "/ai",
    icon: "sparkle",
    title: "Predict any decision",
    text: "Trips, meals, appliances, construction, events. See the footprint and the better option before you commit.",
  },
  {
    href: "/meeting",
    icon: "pin",
    title: "Find the greenest meeting point",
    text: "Tell us where everyone's coming from. We compare venues by everyone's real journeys and hotel nights.",
  },
  {
    href: "/net-zero",
    icon: "target",
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

function CarbonModel() {
  const bars = [
    { label: "Plan", height: "76%", color: "bg-clay" },
    { label: "Shift", height: "44%", color: "bg-fern" },
    { label: "Save", height: "58%", color: "bg-sprout" },
  ];

  return (
    <div className="carbon-3d-scene relative mx-auto h-[300px] w-full max-w-[430px] sm:h-[360px] lg:h-[430px]" aria-hidden>
      <div className="pulse-ring absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sprout/30 bg-forest/20" />
      <div className="animate-float-3d absolute left-1/2 top-[45%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 sm:h-72 sm:w-72">
        <div className="absolute inset-0 rounded-[2rem] bg-[#18352b] shadow-[0_26px_60px_-34px_rgba(0,0,0,0.75)]" />
        <div className="absolute inset-5 grid grid-cols-3 items-end gap-4 rounded-[1.5rem] border border-white/10 bg-[#214334] p-5">
          {bars.map((bar, i) => (
            <div key={bar.label} className="metric-riser relative flex h-full flex-col justify-end">
              <div
                className={`${bar.color} rounded-t-2xl shadow-[0_14px_24px_-18px_rgba(0,0,0,0.75)]`}
                style={{ height: bar.height, transform: `translateZ(${22 + i * 14}px)` }}
              />
              <span className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-white/62">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>
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
    <div className="space-y-8 md:space-y-10">
      {/* Hero */}
      <section className="animate-rise relative overflow-hidden rounded-2xl bg-forest px-5 pb-7 pt-8 text-white shadow-2xl sm:px-7 md:px-10 md:pb-10 md:pt-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_14%,rgba(185,230,109,0.2),transparent_36%),linear-gradient(135deg,rgba(91,145,165,0.18),transparent_45%)]" aria-hidden />
        <svg viewBox="0 0 1200 200" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-28 w-full" aria-hidden>
          <path d="M0 140 C 200 80 380 170 600 120 S 1000 60 1200 110 V200 H0Z" fill="#26634d" opacity="0.45" />
          <path d="M0 170 C 260 120 460 200 720 160 S 1050 120 1200 150 V200 H0Z" fill="#5b91a5" opacity="0.24" />
        </svg>
        <Leaves />

        <div className="relative grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Shift your footprint <em className="text-sprout">before</em> it happens.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
            Most carbon tools measure what you&apos;ve already emitted. CarbonShift predicts the impact of a decision while you can
            still change it, and shows you the lower-carbon choice.
          </p>

          <form
            className="mt-8 flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl sm:flex-row sm:items-center"
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
              className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-ink outline-none placeholder:text-ink/45"
            />
            <button
              type="submit"
              disabled={prompt.trim().length < 5}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-6 py-3 font-semibold text-white transition hover:bg-moss disabled:opacity-40"
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
                className="rounded-full border border-white/20 bg-[#18352b] px-3 py-1.5 text-sm text-white/85 transition hover:border-sprout hover:bg-[#214334] hover:text-white"
              >
                {ex}
              </button>
            ))}
          </div>
          </div>
          <CarbonModel />
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
        <section className="surface-panel animate-rise grid gap-4 rounded-2xl p-5 sm:grid-cols-4 md:p-6" aria-label="Your shift so far">
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
              className="surface-panel interactive-lift group relative flex flex-col overflow-hidden rounded-2xl p-6"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sage text-moss transition group-hover:bg-sprout group-hover:text-forest">
                <Icon name={w.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold text-forest">{w.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{w.text}</p>
              <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium text-moss">
                Start <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-2xl bg-sage/70 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] md:p-10">
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
