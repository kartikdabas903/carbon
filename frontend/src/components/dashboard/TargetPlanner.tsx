"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import type { HistoryEntry } from "@/lib/history";
import { planToTarget } from "@/lib/stats";
import { fmtKg } from "@/lib/utils";

/** "How do I cut X%?" Picks the easiest changes across your decisions that reach the target. */
export function TargetPlanner({ history }: { history: HistoryEntry[] }) {
  const [target, setTarget] = useState(30);
  const plan = planToTarget(history, target);
  const achievedPct = plan.totalKg > 0 ? Math.round((plan.savedKg / plan.totalKg) * 100) : 0;

  return (
    <Card title="Reach a reduction target">
      <label className="block text-sm">
        Cut my emissions by <strong>{target}%</strong>
        <input
          type="range"
          min={5}
          max={90}
          step={5}
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--moss)]"
        />
      </label>

      {plan.picks.length === 0 ? (
        <p className="mt-3 text-sm text-ink/60">No recommendations yet. Run a few predictions first.</p>
      ) : (
        <>
          <p className={plan.reached ? "mt-3 text-sm text-moss" : "mt-3 text-sm text-clay"}>
            {plan.reached
              ? `✓ ${plan.picks.length} change${plan.picks.length === 1 ? "" : "s"} reach the target: ${fmtKg(plan.savedKg)} saved (${achievedPct}%).`
              : `⚠ Even with every recommendation you'd cut ${achievedPct}% (${fmtKg(plan.savedKg)}). Predict more decisions to find more savings.`}
          </p>
          <ol className="mt-3 space-y-2 text-sm">
            {plan.picks.map(({ entry, rec }, i) => (
              <li key={entry.id} className="flex items-start justify-between gap-3 border-t border-line pt-2">
                <span className="min-w-0">
                  <span className="font-medium">
                    {i + 1}. {rec.title}
                  </span>
                  <span className="block truncate text-xs text-ink/50">
                    For: {entry.request.prompt} · {rec.effort} effort
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-ink/70">−{fmtKg(rec.savingsKg)}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </Card>
  );
}
