"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MaccChart } from "@/components/charts/MaccChart";
import { PathwayChart } from "@/components/charts/PathwayChart";
import { Card } from "@/components/ui/Card";
import { useHistory } from "@/lib/history";
import { buildMeasures, buildPathway } from "@/lib/macc";
import { fmtKg, fmtMoney } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { CountUp } from "@/components/ui/CountUp";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAccountGoal, saveAccountGoal } from "@/lib/account";

const THIS_YEAR = new Date().getFullYear();
// Small shares keep one decimal so early years don't all read "0%"
const fmtPct1 = (n: number) => (n > 0 && n < 10 ? `${n.toFixed(1)}%` : `${Math.round(n)}%`);

export default function NetZeroPage() {
  const history = useHistory();
  const { user } = useAuth();
  const [targetPct, setTargetPct] = useState(50);
  const [targetYear, setTargetYear] = useState(Math.max(THIS_YEAR + 2, 2030));
  const [goalLoadedFor, setGoalLoadedFor] = useState<string | null>(null);
  const [goalModified, setGoalModified] = useState(false);
  const [goalSyncError, setGoalSyncError] = useState("");

  useEffect(() => {
    if (!user) {
      const timer = window.setTimeout(() => {
        setGoalLoadedFor(null);
        setGoalModified(false);
        setTargetPct(50);
        setTargetYear(Math.max(THIS_YEAR + 2, 2030));
      }, 0);
      return () => window.clearTimeout(timer);
    }
    let active = true;
    void getAccountGoal().then((goal) => {
      if (!active) return;
      // Keep the defaults unless the saved goal has real numbers (a partial row would blank the pathway)
      if (goal && Number.isFinite(goal.reductionPct)) setTargetPct(goal.reductionPct);
      if (goal && Number.isFinite(goal.targetYear)) setTargetYear(goal.targetYear);
      setGoalModified(false);
      setGoalLoadedFor(user.id);
    }).catch((error: Error) => {
      if (!active) return;
      setGoalSyncError(error.message);
      setGoalLoadedFor(user.id);
    });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (!user || goalLoadedFor !== user.id || !goalModified) return;
    const timer = window.setTimeout(() => {
      void saveAccountGoal({ reductionPct: targetPct, targetYear })
        .then(() => setGoalSyncError(""))
        .catch((error: Error) => setGoalSyncError(error.message));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [goalLoadedFor, goalModified, targetPct, targetYear, user]);

  if (!history) return null;

  const measures = buildMeasures(history);
  const plan = buildPathway(history, measures, targetPct, targetYear);
  const currency = measures.currency ?? "INR";
  const money = (n: number) => fmtMoney(Math.abs(n), currency).replace("≈ ", "");
  const savesMoney = measures.priced.filter((m) => m.perTonne! <= 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Net-zero plan" description="Every change from your decisions, priced per tonne of CO₂e avoided, and the cheapest path to your target." />

      {measures.priced.length + measures.unpriced.length === 0 ? (
        <Card>
          <p className="text-sm">
            No reduction options yet. <Link href="/ai" className="text-moss underline">Predict some decisions</Link> or{" "}
            <Link href="/meeting" className="text-moss underline">plan a meeting</Link>; their recommendations become your plan.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-sm text-ink/60">Reduction options</p>
              <p className="mt-1 font-display font-semibold tracking-tight text-forest text-3xl">{measures.priced.length + measures.unpriced.length}</p>
              <p className="text-xs text-ink/50">{measures.priced.length} with a cost estimate</p>
            </Card>
            <Card>
              <p className="text-sm text-ink/60">Save money and carbon</p>
              <p className="mt-1 font-display font-semibold tracking-tight text-forest text-3xl"><CountUp value={savesMoney.reduce((s, m) => s + m.tonnes, 0) * 1000} format={fmtKg} /></p>
              <p className="text-xs text-ink/50">
                from {savesMoney.length} change{savesMoney.length === 1 ? "" : "s"} that also save{" "}
                {money(savesMoney.reduce((s, m) => s + m.costDelta!, 0))}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-ink/60">Possible reduction</p>
              <p className="mt-1 font-display font-semibold tracking-tight text-forest text-3xl">
                {plan.baselineTonnes > 0
                  ? `${Math.round(((measures.priced.concat(measures.unpriced).reduce((s, m) => s + m.tonnes, 0)) / plan.baselineTonnes) * 100)}%`
                  : "—"}
              </p>
              <p className="text-xs text-ink/50">of {fmtKg(plan.baselineTonnes * 1000)} predicted, if you took every option</p>
            </Card>
          </div>

          <Card title="Marginal abatement cost curve">
            {measures.priced.length + measures.unpriced.length > 0 ? (
              <>
                <MaccChart measures={measures.priced} unpriced={measures.unpriced} currency={currency} />
                {measures.priced.length > 0 && <details className="mt-5 text-sm">
                  <summary className="cursor-pointer text-ink/60">All changes, cheapest per tonne first</summary>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full min-w-[560px]">
                      <thead className="text-xs text-ink/60">
                        <tr>
                          <th className="py-1 pr-3 text-left font-medium">Change</th>
                          <th className="py-1 pr-3 text-right font-medium">CO₂e saved</th>
                          <th className="py-1 pr-3 text-right font-medium">Cost change</th>
                          <th className="py-1 text-right font-medium">Per tonne</th>
                        </tr>
                      </thead>
                      <tbody className="tabular-nums">
                        {measures.priced.map((m) => (
                          <tr key={m.entry.id} className="border-t border-line align-top">
                            <td className="py-1.5 pr-3">
                              {m.rec.title}
                              <span className="block text-xs text-ink/50">For: {m.entry.request.prompt}</span>
                            </td>
                            <td className="py-1.5 pr-3 text-right">{fmtKg(m.tonnes * 1000)}</td>
                            <td className="py-1.5 pr-3 text-right">{m.costDelta! <= 0 ? `saves ${money(m.costDelta!)}` : `+${money(m.costDelta!)}`}</td>
                            <td className="py-1.5 text-right">{m.perTonne! <= 0 ? "−" : "+"}{money(m.perTonne!)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>}
                {measures.priced.length > 0 && <p className="mt-3 text-xs text-ink/50">Costs are rough AI estimates. Hover or focus a bar to see its total cost change and CO₂e saved.</p>}
              </>
            ) : (
              <p className="text-sm text-ink/60">No options have cost estimates yet. New predictions include them.</p>
            )}
          </Card>

          <Card title="Your pathway">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                Cut emissions by <strong>{targetPct}%</strong>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={targetPct}
                  onChange={(e) => { setGoalModified(true); setTargetPct(Number(e.target.value)); }}
                  className="mt-2 w-full accent-[var(--moss)]"
                />
              </label>
              <label className="block text-sm">
                By the end of
                <select
                  value={targetYear}
                  onChange={(e) => { setGoalModified(true); setTargetYear(Number(e.target.value)); }}
                  className="field mt-1 block py-1.5"
                >
                  {Array.from({ length: 2050 - THIS_YEAR + 1 }, (_, i) => THIS_YEAR + i)
                    .filter((yr) => yr <= THIS_YEAR + 5 || yr % 5 === 0)
                    .map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                </select>
              </label>
            </div>

            <p className={plan.reached ? "mt-4 text-sm text-moss" : "mt-4 text-sm text-clay"}>
              {plan.reached
                ? `✓ Reaches ${targetPct}% (${fmtKg(plan.goalTonnes * 1000)}) with ${plan.pathway.reduce((s, y) => s + y.measures.length, 0)} changes, cheapest per tonne first.`
                : `⚠ Taking every option cuts ${Math.round((plan.savedTonnes / plan.baselineTonnes) * 100)}% (${fmtKg(plan.savedTonnes * 1000)}). Predict more decisions to find the rest.`}
            </p>
            {goalSyncError && <p role="status" className="mt-2 text-xs text-clay">Your goal could not sync: {goalSyncError}</p>}

            <div className="mt-5 border-y border-line py-4">
              <h3 className="mb-2 text-sm font-semibold text-ink/80">Reduction over time</h3>
              <PathwayChart pathway={plan.pathway} targetPct={targetPct} targetYear={targetYear} />
            </div>

            <ol className="mt-4 space-y-4">
              {plan.pathway.map((yr) => (
                <li key={yr.year} className="border-t border-line pt-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-base font-semibold">{yr.year}</span>
                    <span className="text-sm text-ink/70">
                      {fmtPct1(yr.cumulativePct)} cut so far ·{" "}
                      {yr.cumulativeCost <= 0 ? `saving ${money(yr.cumulativeCost)}` : `costing ${money(yr.cumulativeCost)}`}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {yr.measures.map((m) => (
                      <li key={m.entry.id} className="flex justify-between gap-3">
                        <span className="min-w-0">
                          {m.rec.title}
                          <span className="block truncate text-xs text-ink/50">For: {m.entry.request.prompt}</span>
                        </span>
                        <span className="shrink-0 text-right tabular-nums text-ink/70">
                          −{fmtKg(m.tonnes * 1000)}
                          <span className="block text-xs text-ink/50">
                            {m.costDelta == null ? "cost unknown" : m.costDelta <= 0 ? `saves ${money(m.costDelta)}` : `+${money(m.costDelta)}`}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </Card>
        </>
      )}
    </div>
  );
}
