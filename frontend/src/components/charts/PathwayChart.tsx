"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, chartTickStyle, chartTooltipStyle } from "@/components/charts/ChartContainer";
import { endLabel, niceTicks } from "@/components/charts/axis";
import type { PathwayYear } from "@/lib/macc";

const pct = (n: number) => (n > 0 && n < 10 ? `${n.toFixed(1)}%` : `${Math.round(n)}%`);

/**
 * Cumulative reduction by year against the target. Steps, because each year's changes
 * are adopted in that year; the line runs to the target year even if changes run out.
 */
export function PathwayChart({
  pathway,
  targetPct,
  targetYear,
}: {
  pathway: PathwayYear[];
  targetPct: number;
  targetYear?: number;
}) {
  if (pathway.length === 0) {
    return <p className="text-sm text-ink/60">No changes are scheduled yet. Add decisions with practical alternatives to build a pathway.</p>;
  }

  const data = [
    // Start the year before at zero, so the first year's step is visible
    { year: pathway[0].year - 1, cumulativePct: 0, cumulativeTonnes: 0 },
    ...pathway.map((y) => ({ year: y.year, cumulativePct: y.cumulativePct, cumulativeTonnes: y.cumulativeTonnes })),
  ];
  const lastPlanned = data[data.length - 1];
  if (targetYear && targetYear > lastPlanned.year) data.push({ ...lastPlanned, year: targetYear });

  const yTicks = niceTicks(Math.min(100, Math.max(targetPct, lastPlanned.cumulativePct)));
  const yMax = Math.min(100, yTicks[yTicks.length - 1]);
  const last = data[data.length - 1];

  return (
    <div className="min-w-0">
      <ChartContainer
        label={`Planned cumulative reduction reaches ${pct(last.cumulativePct)} by ${last.year}, against a ${targetPct}% target.`}
        height={260}
      >
        <AreaChart data={data} margin={{ top: 16, right: 56, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id="pathwayFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-reduced)" stopOpacity={0.24} />
              <stop offset="100%" stopColor="var(--chart-reduced)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="year" type="number" domain={["dataMin", "dataMax"]} allowDecimals={false} tickCount={Math.min(8, data.length)} tick={chartTickStyle} tickLine={false} axisLine={false} />
          <YAxis
            domain={[0, yMax]}
            ticks={yTicks.filter((t) => t <= yMax)}
            width={44}
            tickFormatter={(v) => `${Math.round(Number(v))}%`}
            tick={chartTickStyle}
            tickLine={false}
            axisLine={false}
          />
          <ReferenceLine
            y={targetPct}
            stroke="var(--chart-planned)"
            strokeDasharray="5 4"
            label={{ value: `${targetPct}% target`, fill: "var(--ink)", fontSize: 11, position: "insideTopRight" }}
          />
          <Tooltip
            contentStyle={chartTooltipStyle}
            labelStyle={{ color: "var(--ink)", fontWeight: 600 }}
            formatter={(value, _name, item) => {
              const point = item.payload as (typeof data)[number];
              return [`${pct(Number(value))} · ${point.cumulativeTonnes.toFixed(2)} t CO₂e avoided`, "Cut so far"];
            }}
          />
          <Area
            dataKey="cumulativePct"
            name="Cut so far"
            type="stepAfter"
            stroke="var(--chart-reduced)"
            strokeWidth={2}
            fill="url(#pathwayFill)"
            activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }}
            label={endLabel(data.length - 1, pct)}
          />
        </AreaChart>
      </ChartContainer>
      <p className="mt-2 text-xs text-ink/50">Each step is a year&apos;s changes; the dashed line is your target.</p>
    </div>
  );
}
