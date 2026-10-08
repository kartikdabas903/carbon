"use client";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, chartTickStyle, chartTooltipStyle } from "@/components/charts/ChartContainer";
import { endLabel, fmtTick, niceTicks, timeTicks } from "@/components/charts/axis";
import { fmtKg } from "@/lib/utils";
import type { CumulativePoint } from "@/lib/stats";

const shortDate = (t: number) => new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/**
 * Running total of emissions across decisions: as planned vs with the best change each time.
 * Step lines, because emissions arrive when a decision is made, not gradually in between.
 */
export function CumulativeChart({ points }: { points: CumulativePoint[] }) {
  if (points.length === 0) return <p className="text-sm text-ink/60">No decisions to chart.</p>;

  const first = new Date(points[0].at).getTime();
  const data = [
    // Start from zero a day before the first decision so the first step is visible
    { t: first - 86400e3, label: "Start", plannedKg: 0, withRecsKg: 0, gap: [0, 0] as [number, number] },
    ...points.map((p) => ({
      t: new Date(p.at).getTime(),
      label: p.label,
      plannedKg: p.plannedKg,
      withRecsKg: p.withRecsKg,
      gap: [p.withRecsKg, p.plannedKg] as [number, number],
    })),
  ];
  const last = data[data.length - 1];
  const yTicks = niceTicks(last.plannedKg);
  const lastIndex = data.length - 1;

  return (
    <div className="min-w-0">
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/70">
        <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[var(--chart-planned)]" />As planned</li>
        <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[var(--chart-reduced)]" />With best recommendations</li>
        <li className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-[var(--chart-planned)] opacity-15" />Avoidable</li>
      </ul>
      <ChartContainer
        label={`Cumulative emissions: ${fmtKg(last.plannedKg)} as planned, ${fmtKg(last.withRecsKg)} with recommendations`}
        height={300}
      >
        <ComposedChart data={data} margin={{ top: 12, right: 72, bottom: 4, left: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            ticks={timeTicks(data[0].t, last.t)}
            tickFormatter={(v) => shortDate(Number(v))}
            tick={chartTickStyle}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            ticks={yTicks}
            domain={[0, yTicks[yTicks.length - 1]]}
            width={56}
            tickFormatter={(v) => fmtTick(Number(v))}
            tick={chartTickStyle}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={chartTooltipStyle}
            labelStyle={{ color: "var(--ink)", fontWeight: 600 }}
            labelFormatter={(_v, payload) => {
              const p = payload?.[0]?.payload as (typeof data)[number] | undefined;
              return p ? `${shortDate(p.t)} · ${p.label}` : "";
            }}
            formatter={(value, name) => (name === "Avoidable" ? null : [fmtKg(Number(value)), String(name)])}
          />
          <Area dataKey="gap" name="Avoidable" type="stepAfter" stroke="none" fill="var(--chart-planned)" fillOpacity={0.12} isAnimationActive={false} />
          <Line
            dataKey="plannedKg"
            name="As planned"
            type="stepAfter"
            stroke="var(--chart-planned)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }}
            label={endLabel(lastIndex, fmtKg, -8)}
          />
          <Line
            dataKey="withRecsKg"
            name="With best recommendations"
            type="stepAfter"
            stroke="var(--chart-reduced)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }}
            label={endLabel(lastIndex, fmtKg, 12)}
          />
        </ComposedChart>
      </ChartContainer>
      <p className="mt-2 text-xs text-ink/50">
        {points.length} decision{points.length === 1 ? "" : "s"} · each step is one decision · hover for details
      </p>
    </div>
  );
}
