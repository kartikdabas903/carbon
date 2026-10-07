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
import type { PathwayYear } from "@/lib/macc";

export function PathwayChart({ pathway, targetPct }: { pathway: PathwayYear[]; targetPct: number }) {
  if (pathway.length === 0) {
    return <p className="text-sm text-ink/60">No changes are scheduled yet. Add decisions with practical alternatives to build a pathway.</p>;
  }

  const data = pathway.map((year) => ({
    year: year.year,
    cumulativePct: year.cumulativePct,
    cumulativeTonnes: year.cumulativeTonnes,
  }));
  const maxPct = Math.min(100, Math.max(targetPct, ...data.map((point) => point.cumulativePct)) * 1.12);

  return (
    <div className="min-w-0">
      <ChartContainer
        label={`Planned cumulative reduction reaches ${Math.round(data[data.length - 1].cumulativePct)} percent by ${data[data.length - 1].year}, against a ${targetPct} percent target.`}
        height={280}
      >
        <AreaChart data={data} margin={{ top: 14, right: 20, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id="pathwayFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-reduced)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--chart-reduced)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="year" tick={chartTickStyle} tickLine={false} axisLine={false} />
          <YAxis domain={[0, maxPct]} width={48} tickFormatter={(value) => `${Math.round(Number(value))}%`} tick={chartTickStyle} tickLine={false} axisLine={false} />
          <ReferenceLine y={targetPct} stroke="var(--chart-planned)" strokeDasharray="5 4" label={{ value: `${targetPct}% target`, fill: "var(--chart-planned)", fontSize: 11, position: "insideTopRight" }} />
          <Tooltip
            contentStyle={chartTooltipStyle}
            labelStyle={{ color: "var(--ink)", fontWeight: 600 }}
            formatter={(value, _name, item) => {
              const point = item.payload as typeof data[number];
              return [`${Number(value).toFixed(1)}% · ${point.cumulativeTonnes.toFixed(2)} t CO₂e avoided`, "Cumulative reduction"];
            }}
          />
          <Area dataKey="cumulativePct" name="Cumulative reduction" type="monotone" stroke="var(--chart-reduced)" strokeWidth={2.5} fill="url(#pathwayFill)" activeDot={{ r: 5 }} />
        </AreaChart>
      </ChartContainer>
      <p className="mt-2 text-xs text-ink/50">The dashed line marks your goal; the shaded line shows savings as measures are adopted.</p>
    </div>
  );
}