"use client";

import { BarChart } from "@/components/charts/BarChart";
import { niceTicks } from "@/components/charts/axis";
import type { Measure } from "@/lib/macc";
import { fmtKg } from "@/lib/utils";

const SAVES = "var(--chart-reduced)";
const COSTS = "var(--chart-planned)";

/**
 * Marginal abatement cost ranking: one row per change, cheapest per tonne first.
 * Bars diverge from zero: left = the change pays for itself, right = it costs extra.
 * Each row also states the CO₂ saved and the total money saved or spent.
 */
export function MaccChart({
  measures,
  unpriced = [],
  currency,
}: {
  measures: Measure[];
  unpriced?: Measure[];
  currency: string;
}) {
  const money = (n: number, compact = true) => {
    try {
      return new Intl.NumberFormat(currency === "INR" ? "en-IN" : undefined, {
        style: "currency",
        currency,
        notation: compact ? "compact" : "standard",
        maximumFractionDigits: compact ? 1 : 0,
      }).format(n);
    } catch {
      return `${Math.round(n).toLocaleString()} ${currency}`;
    }
  };

  // Round scale on each side of zero, so ticks read "₹50K" rather than "₹68.6K"
  const negMax = (() => {
    const m = Math.max(0, ...measures.map((x) => -x.perTonne!));
    return m > 0 ? niceTicks(m).at(-1)! : 0;
  })();
  const posMax = (() => {
    const m = Math.max(0, ...measures.map((x) => x.perTonne!));
    return m > 0 ? niceTicks(m).at(-1)! : 0;
  })();
  const span = negMax + posMax || 1;
  const zeroPct = (negMax / span) * 100;
  const pos = (v: number) => ((v + negMax) / span) * 100;
  const ticks = [...new Set([-negMax, -negMax / 2, 0, posMax / 2, posMax])].filter((t) => t >= -negMax && t <= posMax);

  return (
    <div className="min-w-0 space-y-6">
      {measures.length > 0 && (
        <section aria-label="Priced reduction options, cheapest per tonne first">
          <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink/70">
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: SAVES }} />Saves money</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: COSTS }} />Costs extra</span>
            <span className="text-ink/50">Cost per tonne of CO₂e avoided · cheapest first</span>
          </div>

          <ul className="space-y-4">
            {measures.map((m) => {
              const v = m.perTonne!;
              const saves = v <= 0;
              const left = saves ? pos(v) : zeroPct;
              const width = Math.max(0.8, Math.abs(pos(v) - zeroPct));
              return (
                <li key={m.entry.id} tabIndex={0} className="group relative rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-fern/40">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 text-sm font-medium leading-snug text-ink [overflow-wrap:anywhere]">{m.rec.title}</p>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-forest">
                      {saves ? "−" : "+"}{money(Math.abs(v))}<span className="font-normal text-ink/50">/t</span>
                    </p>
                  </div>
                  <p className="text-xs text-ink/55 [overflow-wrap:anywhere]">
                    saves {fmtKg(m.tonnes * 1000)} CO₂e · {m.costDelta! <= 0 ? `saves ${money(Math.abs(m.costDelta!))}` : `costs ${money(m.costDelta!)}`} in total
                  </p>
                  <div className="relative mt-1.5 h-3 rounded-full bg-sage/60">
                    <span className="absolute inset-y-[-3px] w-px bg-ink/40" style={{ left: `${zeroPct}%` }} aria-hidden />
                    <span
                      className={saves ? "absolute inset-y-0 rounded-l-full" : "absolute inset-y-0 rounded-r-full"}
                      style={{ left: `${left}%`, width: `${width}%`, background: saves ? SAVES : COSTS }}
                    />
                  </div>
                  <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden min-w-60 rounded-xl border border-line bg-surface p-3 text-xs shadow-lg group-hover:block group-focus:block">
                    <p className="mb-1 font-medium text-ink">{m.rec.title}</p>
                    <p className="truncate text-ink/50">For: {m.entry.request.prompt}</p>
                    <dl className="mt-1.5 space-y-0.5 tabular-nums">
                      <div className="flex justify-between gap-4"><dt className="text-ink/60">Cost per tonne</dt><dd className="text-ink">{saves ? "−" : "+"}{money(Math.abs(v), false)}</dd></div>
                      <div className="flex justify-between gap-4"><dt className="text-ink/60">CO₂e saved</dt><dd className="text-ink">{fmtKg(m.tonnes * 1000)}</dd></div>
                      <div className="flex justify-between gap-4"><dt className="text-ink/60">{m.costDelta! <= 0 ? "Money saved" : "Extra cost"}</dt><dd className="text-ink">{money(Math.abs(m.costDelta!), false)}</dd></div>
                    </dl>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Shared scale for every bar above */}
          <div className="relative mt-3 h-5 text-[11px] tabular-nums text-ink/50" aria-hidden>
            {ticks.map((t) => (
              <span
                key={t}
                className="absolute top-0 -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full"
                style={{ left: `${pos(t)}%` }}
              >
                {t === 0 ? "0" : `${t < 0 ? "−" : "+"}${money(Math.abs(t))}`}
              </span>
            ))}
          </div>
        </section>
      )}

      {unpriced.length > 0 && (
        <section className="border-t border-line pt-5" aria-label="Reduction options without a cost estimate">
          <h3 className="text-sm font-semibold text-ink/80">Cost unknown</h3>
          <p className="mb-4 mt-1 text-xs text-ink/55">These still save carbon, but have no cost estimate, so they aren&apos;t in the ranking above.</p>
          <BarChart
            rows={unpriced.map((m) => ({
              key: m.entry.id,
              label: m.rec.title,
              segments: [{ name: "CO₂e saved", value: m.tonnes * 1000, color: "var(--chart-single)" }],
            }))}
          />
        </section>
      )}
    </div>
  );
}
