"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, chartTickStyle, chartTooltipStyle } from "@/components/charts/ChartContainer";
import type { Measure } from "@/lib/macc";
import { fmtKg } from "@/lib/utils";

type MaccDatum = {
  id: string;
  label: string;
  tonnes: number;
  perTonne: number;
  costDelta: number;
};

type SavingsDatum = { id: string; label: string; tonnes: number };

const shortLabel = (value: string) => value.length > 25 ? `${value.slice(0, 24)}…` : value;

export function MaccChart({
  measures,
  unpriced = [],
  currency,
}: {
  measures: Measure[];
  unpriced?: Measure[];
  currency: string;
}) {
  const money = (n: number) => {
    try {
      return new Intl.NumberFormat(currency === "INR" ? "en-IN" : undefined, {
        style: "currency", currency, notation: "compact", maximumFractionDigits: 1,
      }).format(n);
    } catch {
      return `${Math.round(n).toLocaleString()} ${currency}`;
    }
  };

  const data: MaccDatum[] = measures.map((measure) => ({
    id: measure.entry.id,
    label: measure.rec.title,
    tonnes: measure.tonnes,
    perTonne: measure.perTonne!,
    costDelta: measure.costDelta!,
  }));
  const minCost = Math.min(0, ...data.map((item) => item.perTonne));
  const maxCost = Math.max(0, ...data.map((item) => item.perTonne));
  const costRange = Math.max(1, maxCost - minCost);
  const domain: [number, number] = [minCost - costRange * 0.08, maxCost + costRange * 0.08];
  const chartHeight = Math.min(520, Math.max(280, data.length * 52 + 72));
  const savingsData: SavingsDatum[] = unpriced.map((measure) => ({
    id: measure.entry.id,
    label: measure.rec.title,
    tonnes: measure.tonnes,
  }));
  const savingsHeight = Math.min(360, Math.max(190, savingsData.length * 44 + 56));

  return (
    <div className="min-w-0 space-y-6">
      {data.length > 0 && (
        <section aria-label="Priced abatement options">
          <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink/70">
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--chart-reduced)]" />Saves money</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--chart-planned)]" />Costs extra</span>
            <span className="text-ink/50">Bars are ordered from lowest cost per tonne to highest.</span>
          </div>
          <p className="mb-2 text-xs font-medium text-ink/60">Cost per tonne of CO₂e avoided · below zero means the change saves money</p>
          <ChartContainer label={`Abatement cost comparison for ${data.length} changes. Negative costs save money.`} height={chartHeight}>
            <RechartsBarChart data={data} layout="vertical" margin={{ top: 6, right: 20, bottom: 4, left: 0 }} barCategoryGap={12}>
              <CartesianGrid vertical stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={domain}
                tickFormatter={(value) => money(Number(value))}
                tick={chartTickStyle}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis dataKey="label" type="category" width={154} tickFormatter={shortLabel} tick={chartTickStyle} tickLine={false} axisLine={false} interval={0} />
              <ReferenceLine x={0} stroke="var(--ink)" strokeOpacity={0.55} strokeWidth={1.5} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                labelStyle={{ color: "var(--ink)", fontWeight: 600 }}
                itemStyle={{ color: "var(--ink)" }}
                formatter={(value, _name, item) => {
                  const measure = item.payload as MaccDatum;
                  const saved = measure.costDelta <= 0
                    ? `saves ${money(Math.abs(measure.costDelta))} total`
                    : `costs ${money(measure.costDelta)} total`;
                  return [`${money(Number(value))} / t · ${fmtKg(measure.tonnes * 1000)} saved · ${saved}`, "Cost per tonne"];
                }}
                cursor={{ fill: "var(--paper)", opacity: 0.7 }}
              />
              <Bar dataKey="perTonne" name="Cost per tonne" radius={[0, 5, 5, 0]}>
                {data.map((measure) => (
                  <Cell key={measure.id} fill={measure.perTonne <= 0 ? "var(--chart-reduced)" : "var(--chart-planned)"} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ChartContainer>
        </section>
      )}

      {savingsData.length > 0 && (
        <section className="border-t border-line pt-5" aria-label="Unpriced abatement options">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-ink/80">Cost unknown</h3>
            <p className="mt-1 text-xs text-ink/55">These options still show their estimated carbon savings, but are excluded from the cost ranking.</p>
          </div>
          <ChartContainer label="Carbon savings for options without cost estimates" height={savingsHeight}>
            <RechartsBarChart data={savingsData} layout="vertical" margin={{ top: 4, right: 18, bottom: 2, left: 0 }} barCategoryGap={12}>
              <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
              <XAxis type="number" tickFormatter={(value) => fmtKg(Number(value) * 1000)} tick={chartTickStyle} tickLine={false} axisLine={false} />
              <YAxis dataKey="label" type="category" width={154} tickFormatter={shortLabel} tick={chartTickStyle} tickLine={false} axisLine={false} interval={0} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                labelStyle={{ color: "var(--ink)", fontWeight: 600 }}
                formatter={(value) => [`${fmtKg(Number(value) * 1000)} saved`, "CO₂e"]}
              />
              <Bar dataKey="tonnes" name="CO₂e saved" fill="var(--chart-single)" radius={[0, 5, 5, 0]}>
                {savingsData.map((measure) => <Cell key={measure.id} fill="var(--chart-single)" />)}
              </Bar>
            </RechartsBarChart>
          </ChartContainer>
        </section>
      )}
    </div>
  );
}