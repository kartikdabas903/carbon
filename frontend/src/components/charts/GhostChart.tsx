"use client";

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, chartTickStyle, chartTooltipStyle } from "@/components/charts/ChartContainer";
import { endLabel, fmtTick, niceTicks } from "@/components/charts/axis";
import type { GhostPoint } from "@/lib/ghost";
import { fmtKg } from "@/lib/utils";

const PAST_SHARE = 45;
const DAY = 24 * 3600 * 1000;
const fmtDay = (time: number) => new Date(time).toLocaleDateString(undefined, { day: "numeric", month: "short" });

type Point = { at: number; youKg: number; ghostKg: number };
type ChartPoint = {
  x: number;
  at: number;
  youPast: number | null;
  ghostPast: number | null;
  youProjection: number | null;
  ghostProjection: number | null;
};

/** Cumulative emissions of You vs Ghost You, with the future clearly separated. */
export function GhostChart({ points, now, end }: { points: GhostPoint[]; now: Point; end: Point }) {
  const start = Math.min(points[0]?.at ?? now.at, now.at - DAY);
  const chartX = (time: number) => time <= now.at
    ? ((time - start) / (now.at - start)) * PAST_SHARE
    : PAST_SHARE + ((time - now.at) / (end.at - now.at)) * (100 - PAST_SHARE);

  const historyByTime = new Map<number, Point>([[start, { at: start, youKg: 0, ghostKg: 0 }]]);
  for (const point of points) historyByTime.set(point.at, point);
  historyByTime.set(now.at, now);
  const history = [...historyByTime.values()].sort((a, b) => a.at - b.at);
  const data: ChartPoint[] = history.map((point) => ({
    x: chartX(point.at),
    at: point.at,
    youPast: point.youKg,
    ghostPast: point.ghostKg,
    youProjection: point.at === now.at ? now.youKg : null,
    ghostProjection: point.at === now.at ? now.ghostKg : null,
  }));
  data.push({ x: 100, at: end.at, youPast: null, ghostPast: null, youProjection: end.youKg, ghostProjection: end.ghostKg });

  const max = Math.max(0, ...data.map((point) => Math.max(point.youPast ?? 0, point.ghostPast ?? 0, point.youProjection ?? 0, point.ghostProjection ?? 0)));
  // Round ticks (0, 25 t, 50 t…) instead of a ragged top value like "99.55 t"
  const yTicks = niceTicks(Math.max(1, max));
  const yMax = yTicks[yTicks.length - 1];
  const lastIndex = data.length - 1;

  return (
    <div className="min-w-0">
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/70">
        <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[var(--chart-planned)]" />You</li>
        <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[var(--chart-reduced)]" />Ghost You</li>
        <li className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-ink/40" />Projected</li>
      </ul>
      <ChartContainer
        label={`You: ${fmtKg(now.youKg)} so far, ${fmtKg(end.youKg)} projected by 2030. Ghost You: ${fmtKg(now.ghostKg)} so far, ${fmtKg(end.ghostKg)} by 2030.`}
        height={330}
      >
        <RechartsLineChart data={data} margin={{ top: 14, right: 72, bottom: 4, left: 4 }}>
          <ReferenceArea x1={PAST_SHARE} x2={100} fill="var(--paper)" fillOpacity={0.8} />
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 100]}
            ticks={[0, PAST_SHARE, 100]}
            tickFormatter={(value) => value === PAST_SHARE ? "Today" : value === 100 ? "Dec 2030" : fmtDay(start)}
            tick={chartTickStyle}
            tickLine={false}
            axisLine={false}
          />
          <YAxis domain={[0, yMax]} ticks={yTicks} width={56} tickFormatter={(value) => fmtTick(Number(value))} tick={chartTickStyle} tickLine={false} axisLine={false} />
          <ReferenceLine x={PAST_SHARE} stroke="var(--ink)" strokeOpacity={0.35} strokeDasharray="3 3" />
          <Tooltip
            contentStyle={chartTooltipStyle}
            labelStyle={{ color: "var(--ink)", fontWeight: 600 }}
            labelFormatter={(_value, payload) => {
              const point = payload?.[0]?.payload as ChartPoint | undefined;
              return point ? `${fmtDay(point.at)}${point.x > PAST_SHARE ? " · projected" : " · so far"}` : "Emissions";
            }}
            formatter={(value, name) => [fmtKg(Number(value)), String(name)]}
          />
          <Line dataKey="youPast" name="You · so far" type="stepAfter" stroke="var(--chart-planned)" strokeWidth={2} dot={false} activeDot={{ r: 5 }} connectNulls={false} />
          <Line dataKey="ghostPast" name="Ghost You · so far" type="stepAfter" stroke="var(--chart-reduced)" strokeWidth={2} dot={false} activeDot={{ r: 5 }} connectNulls={false} />
          <Line dataKey="youProjection" name="You · projected" type="linear" stroke="var(--chart-planned)" strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={{ r: 5 }} connectNulls label={endLabel(lastIndex, fmtKg, -8)} />
          <Line dataKey="ghostProjection" name="Ghost You · projected" type="linear" stroke="var(--chart-reduced)" strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={{ r: 5 }} connectNulls label={endLabel(lastIndex, fmtKg, 12)} />
        </RechartsLineChart>
      </ChartContainer>
      <p className="mt-2 text-xs text-ink/50">The left side is recorded history; the shaded right side is projected through December 2030.</p>
    </div>
  );
}