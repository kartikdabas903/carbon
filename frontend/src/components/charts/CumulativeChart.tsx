"use client";
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, chartTickStyle, chartTooltipStyle } from "@/components/charts/ChartContainer";
import { fmtTick } from "@/components/charts/axis";
import { fmtKg } from "@/lib/utils";
import type { CumulativePoint } from "@/lib/stats";

const shortDate =(iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/** Running total of emissions across decisions: as planned vs with the best change each time. */
export function CumulativeChart({ points }: { points: CumulativePoint[] }) {
  if (points.length === 0) return <p className="text-sm text-ink/60">No decisions to chart.</p>;

  const data = [
    { at: points[0].at, label: "Start", plannedKg: 0, withRecsKg: 0 },
    ...points.map((point) => ({ ...point, label: shortDate(point.at) })),
  ];
  const last = data[data.length - 1];

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/70">
        <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[var(--chart-planned)]" />As planned</li>
        <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[var(--chart-reduced)]" />With best recommendations</li>
      </ul>
      <ChartContainer
        label={`Cumulative emissions: ${fmtKg(last.plannedKg)} as planned, ${fmtKg(last.withRecsKg)} with recommendations`}
        height={300}
      >
        <RechartsLineChart data={data} margin={{ top: 10, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="label" tick={chartTickStyle} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis width={66} tickFormatter={(value) => fmtTick(Number(value))} tick={chartTickStyle} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={chartTooltipStyle}
            labelStyle={{ color: "var(--ink)", fontWeight: 600 }}
            formatter={(value, name) => [fmtKg(Number(value)), String(name)]}
          />
          <Line dataKey="plannedKg" name="As planned" type="monotone" stroke="var(--chart-planned)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
          <Line dataKey="withRecsKg" name="With best recommendations" type="monotone" stroke="var(--chart-reduced)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
        </RechartsLineChart>
      </ChartContainer>
      <p className="mt-2 text-xs text-ink/50">{points.length} decision{points.length === 1 ? "" : "s"} · through {shortDate(last.at)}</p>
    </div>
  );
}
