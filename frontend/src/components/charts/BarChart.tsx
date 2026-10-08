"use client";

import { fmtKg } from "@/lib/utils";

export interface BarSegment {
  name: string;
  value: number;
  color: string; // CSS colour, e.g. "var(--chart-reduced)"
}

export interface BarRow {
  key: string;
  label: string;
  segments: BarSegment[];
}

// Small values still get a visible sliver, so nothing silently disappears next to a huge bar
const MIN_VISIBLE_PCT = 1.5;

/**
 * Ranked horizontal bars. The full label sits above each bar (never truncated), the value
 * sits at the bar's tip, stacked segments are split by a 2px surface gap, and hover or
 * keyboard focus shows the breakdown and share of the total.
 */
export function BarChart({
  rows,
  legend,
  format = fmtKg,
  showShare = false,
}: {
  rows: BarRow[];
  legend?: { name: string; color: string }[];
  format?: (n: number) => string;
  showShare?: boolean; // add "· 12%" after each value, for part-of-a-whole charts
}) {
  if (rows.length === 0) return <p className="text-sm text-ink/60">No data to chart.</p>;

  const total = (r: BarRow) => r.segments.reduce((s, x) => s + x.value, 0);
  const max = Math.max(...rows.map(total), 1e-9);
  const grand = rows.reduce((s, r) => s + total(r), 0) || 1;
  const share = (v: number) => {
    const pct = (v / grand) * 100;
    return pct > 0 && pct < 1 ? "<1%" : `${Math.round(pct)}%`;
  };

  return (
    <div className="min-w-0">
      {legend && legend.length > 1 && (
        <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/70">
          {legend.map((l) => (
            <li key={l.name} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
              {l.name}
            </li>
          ))}
        </ul>
      )}
      <ul className="space-y-3.5">
        {rows.map((r) => {
          const t = total(r);
          const visible = r.segments.filter((s) => s.value > 0);
          const width = t > 0 ? Math.max(MIN_VISIBLE_PCT, (t / max) * 100) : 0;
          return (
            <li
              key={r.key}
              tabIndex={0}
              className="group relative rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-fern/40"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 text-sm leading-snug text-ink/85 [overflow-wrap:anywhere]">{r.label}</p>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-forest">
                  {format(t)}
                  {showShare && <span className="ml-1 font-normal text-ink/50">· {share(t)}</span>}
                </p>
              </div>
              <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-sage/70">
                <div className="flex h-full transition-[width] duration-700 ease-out" style={{ width: `${width}%` }}>
                  {visible.map((s, i) => (
                    <div
                      key={s.name}
                      className={i === visible.length - 1 ? "h-full rounded-r-full" : "h-full"}
                      style={{
                        width: `${(s.value / t) * 100}%`,
                        minWidth: 3,
                        background: s.color,
                        marginLeft: i > 0 ? 2 : 0, // surface gap between segments
                      }}
                    />
                  ))}
                </div>
              </div>
              {r.segments.length > 1 && (
                <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden min-w-56 rounded-xl border border-line bg-surface p-3 text-xs shadow-lg group-hover:block group-focus:block">
                  <p className="mb-1.5 font-medium text-ink">{r.label}</p>
                  {r.segments.map((s) => (
                    <p key={s.name} className="flex items-center justify-between gap-4 py-0.5 text-ink/70">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                        {s.name}
                      </span>
                      <span className="tabular-nums text-ink">
                        {format(s.value)} <span className="text-ink/50">({t > 0 ? Math.round((s.value / t) * 100) : 0}%)</span>
                      </span>
                    </p>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
