import { avoidedKg, choiceSavingKg, EFFORT_WEIGHT, isDone, isPlanned, type HistoryEntry } from "@/lib/history";
import type { AIRecommendation } from "@/types/ai";
import type { ActivityCategory } from "@/types/carbon";

/** Largest single saving for an entry (its recommendations are either/or). */
export const bestSaving = (e: HistoryEntry) =>
  Math.max(0, ...e.prediction.recommendations.map((r) => r.savingsKg));

export interface CategoryTotal {
  category: ActivityCategory;
  kg: number;
  avoidableKg: number;
}

export interface CumulativePoint {
  at: string;
  label: string;
  plannedKg: number;
  withRecsKg: number;
}

export interface Summary {
  count: number;
  totalKg: number;
  avoidableKg: number;
  avoidedKg: number; // real savings from changes the user says they made
  choices: number; // decisions marked done
  plannedKg: number; // savings from changes still planned
  planned: number;
  byCategory: CategoryTotal[];
  scopes: { scope: 1 | 2 | 3; kg: number }[];
  unscopedKg: number;
  cumulative: CumulativePoint[];
  top: HistoryEntry[];
}

export function summarize(history: HistoryEntry[]): Summary {
  const chronological = [...history].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const byCategory = new Map<ActivityCategory, CategoryTotal>();
  const scopeKg = { 1: 0, 2: 0, 3: 0 };
  let unscopedKg = 0;
  let planned = 0;
  let withRecs = 0;
  const cumulative: CumulativePoint[] = [];

  for (const e of chronological) {
    const p = e.prediction;
    const saving = bestSaving(e);
    const cat = byCategory.get(p.category) ?? { category: p.category, kg: 0, avoidableKg: 0 };
    cat.kg += p.predictedKg;
    cat.avoidableKg += saving;
    byCategory.set(p.category, cat);

    if (p.scopes) {
      scopeKg[1] += p.scopes.scope1;
      scopeKg[2] += p.scopes.scope2;
      scopeKg[3] += p.scopes.scope3;
    } else {
      unscopedKg += p.predictedKg; // saved before scopes existed
    }

    planned += p.predictedKg;
    withRecs += p.predictedKg - saving;
    cumulative.push({ at: e.createdAt, label: e.request.prompt, plannedKg: planned, withRecsKg: withRecs });
  }

  const done = history.filter((e) => isDone(e.choice));
  const pending = history.filter((e) => isPlanned(e.choice));
  return {
    count: history.length,
    totalKg: planned,
    avoidableKg: planned - withRecs,
    avoidedKg: done.reduce((s, e) => s + avoidedKg(e), 0),
    choices: done.length,
    plannedKg: pending.reduce((s, e) => s + choiceSavingKg(e), 0),
    planned: pending.length,
    byCategory: [...byCategory.values()].sort((a, b) => b.kg - a.kg),
    scopes: ([1, 2, 3] as const).map((s) => ({ scope: s, kg: scopeKg[s] })),
    unscopedKg,
    cumulative,
    top: [...history].sort((a, b) => b.prediction.predictedKg - a.prediction.predictedKg).slice(0, 5),
  };
}

export interface TargetPick {
  entry: HistoryEntry;
  rec: AIRecommendation;
}

/**
 * Easiest set of changes reaching `targetPct` of total emissions: at most one
 * recommendation per decision, best savings-per-effort first.
 */
export function planToTarget(history: HistoryEntry[], targetPct: number) {
  const total = history.reduce((s, e) => s + e.prediction.predictedKg, 0);
  const goal = (total * targetPct) / 100;
  const candidates: TargetPick[] = history.flatMap((e) => {
    const best = [...e.prediction.recommendations].sort(
      (a, b) => b.savingsKg * EFFORT_WEIGHT[b.effort] - a.savingsKg * EFFORT_WEIGHT[a.effort]
    )[0];
    return best ? [{ entry: e, rec: best }] : [];
  });
  candidates.sort((a, b) => b.rec.savingsKg * EFFORT_WEIGHT[b.rec.effort] - a.rec.savingsKg * EFFORT_WEIGHT[a.rec.effort]);

  const picks: TargetPick[] = [];
  let saved = 0;
  for (const c of candidates) {
    if (saved >= goal) break;
    picks.push(c);
    saved += c.rec.savingsKg;
  }
  return { picks, savedKg: saved, goalKg: goal, reached: saved >= goal, totalKg: total };
}

/** Rough cost of offsetting what can't be avoided; prices vary widely by project type. */
export const offsetCostUsd = (kg: number) => ({
  // Typical voluntary-market avoidance credits ~ $5-30/t; durable removals often $100+/t
  low: (kg / 1000) * 10,
  high: (kg / 1000) * 30,
  removal: (kg / 1000) * 150,
});

/** Everyday comparisons for an amount of CO₂e. */
export function equivalents(kg: number) {
  return [
    // DESNZ average car, 0.166 kg/km
    { label: "km driven in an average car", value: kg / 0.166 },
    // A mature tree absorbs roughly 21 kg CO₂ a year (US Forest Service estimate)
    { label: "trees absorbing CO₂ for a year", value: kg / 21 },
    // 1.5 °C-aligned lifestyle budget for 2030: 2.5 t per person per year (Hot or Cool Institute)
    { label: "days of a 1.5 °C personal carbon budget", value: kg / (2500 / 365) },
  ];
}

export const SCOPE_LABEL: Record<1 | 2 | 3, string> = {
  1: "Scope 1 · fuel burned directly",
  2: "Scope 2 · purchased electricity",
  3: "Scope 3 · travel, food, goods, waste",
};
