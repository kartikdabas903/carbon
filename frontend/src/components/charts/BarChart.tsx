"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, chartTickStyle, chartTooltipStyle } from "@/components/charts/ChartContainer";
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

/** Responsive stacked comparisons with a shared numeric axis and full-value tooltips. */
export function BarChart({
  rows,
  legend,
  format = fmtKg,
}: {
  rows: BarRow[];
  legend?: { name: string; color: string }[];
  format?: (n: number) => string;
}) {
  if (rows.length === 0) return <p className="text-sm text-ink/60">No data to chart.</p>;

  const series = [...new Set(rows.flatMap((row) => row.segments.map((segment) => segment.name)))];
  const data = rows.map((row) => ({
    key: row.key,
    label: row.label,
    ...Object.fromEntries(series.map((name) => [name, row.segments.find((segment) => segment.name === name)?.value ?? 0])),
  }));
  const height = Math.min(460, Math.max(190, rows.length * 48 + 54));
  const tickLabel = (value: string) => value.length > 26 ? `${value.slice(0, 25)}…` : value;

  return (
    <div>
      {legend && legend.length > 1 && (
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/70">
          {legend.map((l) => (
            <li key={l.name} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
              {l.name}
            </li>
          ))}
        </ul>
      )}
      <ChartContainer label="Horizontal comparison chart" height={height}>
        <RechartsBarChart data={data} layout="vertical" margin={{ top: 4, right: 18, bottom: 2, left: 0 }} barCategoryGap={12}>
          <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
          <XAxis
            type="number"
            tickFormatter={(value) => format(Number(value))}
            tick={chartTickStyle}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            dataKey="label"
            type="category"
            width={150}
            tickFormatter={tickLabel}
            tick={chartTickStyle}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <Tooltip
            contentStyle={chartTooltipStyle}
            labelStyle={{ color: "var(--ink)", fontWeight: 600 }}
            itemStyle={{ color: "var(--ink)" }}
            formatter={(value, name) => [format(Number(value)), String(name)]}
            cursor={{ fill: "var(--paper)", opacity: 0.7 }}
          />
          {series.map((name) => (
            <Bar key={name} dataKey={name} name={name} stackId="total" radius={[0, 5, 5, 0]}>
              {rows.map((row) => (
                <Cell key={row.key} fill={row.segments.find((segment) => segment.name === name)?.color ?? "transparent"} />
              ))}
            </Bar>
          ))}
        </RechartsBarChart>
      </ChartContainer>
    </div>
  );
}
