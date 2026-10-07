"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { DEFAULT_MONTHLY_KG, setBudget, usedThisMonth, useBudget } from "@/lib/budget";
import type { HistoryEntry } from "@/lib/history";
import { fmtKg } from "@/lib/utils";
import { getAccountBudget, saveAccountBudget } from "@/lib/account";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * Monthly carbon budget. Counts what you committed to this month (your chosen
 * option, or the prediction if you haven't chosen). `thisKg` highlights one decision.
 */
export function BudgetMeter({ history, thisKg }: { history: HistoryEntry[]; thisKg?: number }) {
  const budget = useBudget();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;
    void getAccountBudget().then((result) => {
      if (active && result.monthlyBudgetKg != null) setBudget(result.monthlyBudgetKg);
    }).catch((cause: Error) => {
      if (active) setError(cause.message);
    });
    return () => { active = false; };
  }, [user]);

  if (budget == null) return null;

  const used = usedThisMonth(history);
  const left = budget - used;
  const over = left < 0;
  const pct = Math.min(100, (used / budget) * 100);
  const thisPct = thisKg != null ? Math.min(pct, (thisKg / budget) * 100) : 0;

  return (
    <Card title="Monthly carbon budget">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display font-semibold tracking-tight text-forest text-3xl">
          {fmtKg(used)} <span className="text-base font-normal text-ink/60">of {fmtKg(budget)}</span>
        </p>
        <p className={over ? "text-sm font-medium text-clay" : "text-sm text-ink/70"}>
          {over ? `⚠ Over budget by ${fmtKg(-left)}` : `${fmtKg(left)} left this month`}
        </p>
      </div>
      <div
        className="relative mt-3 h-3 overflow-hidden rounded bg-moss/15"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={budget}
        aria-valuenow={Math.round(used)}
        aria-label="Carbon budget used this month"
      >
        <div className={over ? "h-full rounded-r bg-clay" : "h-full rounded-r bg-moss"} style={{ width: `${pct}%` }} />
        {thisKg != null && thisPct > 0 && (
          // This decision's share, drawn as the last part of the used bar
          <div
            className="absolute top-0 h-full bg-lime"
            style={{ left: `${Math.max(0, pct - thisPct)}%`, width: `${thisPct}%`, borderLeft: "2px solid white" }}
          />
        )}
      </div>
      {thisKg != null && (
        <p className="mt-2 text-sm text-ink/70">
          {thisKg <= budget ? (
            <>
              This decision uses <strong className="text-ink">{Math.round((thisKg / budget) * 100)}%</strong> of your
              monthly budget
              <span className="ml-1 inline-block h-2 w-2 rounded-sm bg-lime align-middle" aria-hidden />.
            </>
          ) : (
            // One-off projects (construction, events) dwarf a personal monthly budget; a percentage stops meaning anything
            <>
              This decision alone is <strong className="text-ink">{(thisKg / budget).toLocaleString(undefined, { maximumFractionDigits: 1 })}×</strong>{" "}
              your monthly budget. For one-off projects, focus on the material and method swaps above.
            </>
          )}
        </p>
      )}
      <div className="mt-3 text-xs text-ink/50">
        {editing ? (
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!(Number(draft) > 0)) return;
              void saveAccountBudget(Number(draft)).then(() => {
                setBudget(Number(draft));
                setError("");
                setEditing(false);
              }).catch((cause: Error) => setError(cause.message));
            }}
          >
            <input
              type="number"
              min={1}
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="field w-28 py-1 text-sm"
              aria-label="Monthly budget in kg"
            />
            <span>kg per month</span>
            <button type="submit" className="text-moss underline">Save</button>
            <button type="button" onClick={() => setEditing(false)} className="underline">Cancel</button>
          </form>
        ) : (
          <>
            Default: {DEFAULT_MONTHLY_KG} kg/month, a 1.5 °C-aligned personal budget (2.5 t/year).{" "}
            <button onClick={() => { setDraft(String(budget)); setEditing(true); }} className="text-moss underline">
              Change
            </button>
          </>
        )}
      </div>
      {error && <p role="status" className="mt-2 text-xs text-clay">{error}</p>}
    </Card>
  );
}
