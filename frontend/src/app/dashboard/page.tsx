"use client";
import Link from "next/link";
import { useState } from "react";
import { HistoryFilters } from "@/components/ui/HistoryFilters";
import { applyFilter, DEFAULT_FILTER, type HistoryFilter } from "@/lib/filters";
import { BarChart, type BarRow } from "@/components/charts/BarChart";
import { CumulativeChart } from "@/components/charts/CumulativeChart";
import { StatTiles } from "@/components/dashboard/StatTiles";
import { BudgetMeter } from "@/components/dashboard/BudgetMeter";
import { TargetPlanner } from "@/components/dashboard/TargetPlanner";
import { Card } from "@/components/ui/Card";
import { fmtDate, useHistory } from "@/lib/history";
import { bestSaving, SCOPE_LABEL, summarize } from "@/lib/stats";
import { fmtKg } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

const PLANNED = "var(--chart-planned)";
const REDUCED = "var(--chart-reduced)";
const AVOIDABLE_LEGEND = [
  { name: "Remaining after best change", color: REDUCED },
  { name: "Avoidable", color: PLANNED },
];

const split = (kg: number, avoidable: number) => [
  { name: "Remaining after best change", value: Math.max(0, kg - avoidable), color: REDUCED },
  { name: "Avoidable", value: Math.min(avoidable, kg), color: PLANNED },
];

export default function DashboardPage() {
  const history = useHistory();
  const [filter, setFilter] = useState<HistoryFilter>(DEFAULT_FILTER);
  if (!history) return null;

  if (history.length === 0)
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Track" icon="chart" title="Dashboard" description="Everything you've predicted and chosen, and how much you could still shift." />
        <Card>
          <p className="text-sm">
            Your dashboard fills in as you analyse decisions.{" "}
            <Link href="/ai" className="text-moss underline">Predict an activity</Link> or{" "}
            <Link href="/calculate" className="text-moss underline">calculate one</Link> to get started.
          </p>
        </Card>
      </div>
    );

  // Charts follow the filter; the monthly budget always counts everything
  const shown = applyFilter(history, filter);
  const s = summarize(shown);
  const categoryRows: BarRow[] = s.byCategory.map((c) => ({
    key: c.category,
    label: c.category[0].toUpperCase() + c.category.slice(1),
    segments: split(c.kg, c.avoidableKg),
  }));
  const scopeRows: BarRow[] = s.scopes.map((x) => ({
    key: String(x.scope),
    label: SCOPE_LABEL[x.scope],
    segments: [{ name: "Emissions", value: x.kg, color: "var(--chart-single)" }],
  }));
  const topRows: BarRow[] = s.top.map((e) => ({
    key: e.id,
    label: e.request.prompt,
    segments: split(e.prediction.predictedKg, bestSaving(e)),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Track"
        icon="chart"
        title="Dashboard"
        description="Everything you've predicted and chosen, and how much you could still shift."
        actions={
          <Link href="/report" className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-moss hover:bg-sage/60">
            Export report (PDF)
          </Link>
        }
      />
      <HistoryFilters value={filter} onChange={setFilter} shown={shown.length} total={history.length} />
      <StatTiles summary={s} />
      <BudgetMeter history={history} />

      <Card title="Cumulative emissions: as planned vs with recommendations">
        <CumulativeChart points={s.cumulative} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="By category">
          <BarChart rows={categoryRows} legend={AVOIDABLE_LEGEND} />
        </Card>
        <Card title="By GHG Protocol scope">
          <BarChart rows={scopeRows} />
          {s.unscopedKg > 0 && (
            <p className="mt-3 text-xs text-ink/50">{fmtKg(s.unscopedKg)} from older entries has no scope breakdown.</p>
          )}
          <p className="mt-3 text-xs text-ink/50">Assumes vehicles and buildings are your own (Scope 1).</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Biggest decisions">
          <BarChart rows={topRows} legend={AVOIDABLE_LEGEND} />
        </Card>
        <TargetPlanner history={shown} />
      </div>

      <details className="rounded-3xl border border-line/80 bg-surface p-5 text-sm">
        <summary className="cursor-pointer font-semibold text-ink/70">Data table</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead className="text-xs text-ink/60">
              <tr>
                <th className="py-1 pr-3 font-medium">When</th>
                <th className="py-1 pr-3 font-medium">Activity</th>
                <th className="py-1 pr-3 font-medium">Category</th>
                <th className="py-1 pr-3 text-right font-medium">Predicted</th>
                <th className="py-1 text-right font-medium">Best saving</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {shown.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="py-1.5 pr-3 whitespace-nowrap text-ink/60">{fmtDate(e.createdAt)}</td>
                  <td className="py-1.5 pr-3">{e.request.prompt}</td>
                  <td className="py-1.5 pr-3 capitalize">{e.prediction.category}</td>
                  <td className="py-1.5 pr-3 text-right">{fmtKg(e.prediction.predictedKg)}</td>
                  <td className="py-1.5 text-right">{fmtKg(bestSaving(e))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
