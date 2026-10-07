import type { HistoryEntry } from "@/lib/history";
import type { AIRecommendation } from "@/types/ai";

/** One abatement measure: a recommendation from a past decision, priced per tonne. */
export interface Measure {
  entry: HistoryEntry;
  rec: AIRecommendation;
  tonnes: number;
  costDelta: number | null; // option cost minus plan cost; negative saves money
  perTonne: number | null; // costDelta / tonnes
}

export interface PathwayYear {
  year: number;
  measures: Measure[];
  cumulativeTonnes: number;
  cumulativePct: number;
  cumulativeCost: number;
}

/**
 * One measure per decision (alternatives for the same decision are either/or): the
 * cheapest per tonne among those with cost data, else the biggest saving.
 * Priced measures are in the most common currency so they're comparable.
 */
export function buildMeasures(history: HistoryEntry[]) {
  const currencies = new Map<string, number>();
  for (const e of history) if (e.prediction.currency) currencies.set(e.prediction.currency, (currencies.get(e.prediction.currency) ?? 0) + 1);
  const currency = [...currencies.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const measures: Measure[] = [];
  for (const e of history) {
    const p = e.prediction;
    const options = p.recommendations
      .filter((r) => r.savingsKg > 0)
      .map((rec) => {
        const priced = rec.cost != null && p.costEstimate != null && p.currency === currency;
        const costDelta = priced ? rec.cost! - p.costEstimate! : null;
        const tonnes = rec.savingsKg / 1000;
        return { entry: e, rec, tonnes, costDelta, perTonne: costDelta == null ? null : costDelta / tonnes };
      });
    const priced = options.filter((o) => o.perTonne != null).sort((a, b) => a.perTonne! - b.perTonne!);
    const pick = priced[0] ?? options.sort((a, b) => b.tonnes - a.tonnes)[0];
    if (pick) measures.push(pick);
  }
  const pricedMeasures = measures.filter((m) => m.perTonne != null).sort((a, b) => a.perTonne! - b.perTonne!);
  const unpriced = measures.filter((m) => m.perTonne == null).sort((a, b) => b.tonnes - a.tonnes);
  return { currency, priced: pricedMeasures, unpriced };
}

/**
 * Cheapest-per-tonne first until the target is reached, spread evenly over the
 * years up to targetYear. Unpriced measures come after priced ones.
 */
export function buildPathway(
  history: HistoryEntry[],
  measures: { priced: Measure[]; unpriced: Measure[] },
  targetPct: number,
  targetYear: number,
  now = new Date()
) {
  const baselineTonnes = history.reduce((s, e) => s + e.prediction.predictedKg, 0) / 1000;
  const goal = (baselineTonnes * targetPct) / 100;
  const chosen: Measure[] = [];
  let saved = 0;
  for (const m of [...measures.priced, ...measures.unpriced]) {
    if (saved >= goal) break;
    chosen.push(m);
    saved += m.tonnes;
  }

  const years = Math.max(1, targetYear - now.getFullYear() + 1);
  const perYear = Math.ceil(chosen.length / years) || 1;
  const pathway: PathwayYear[] = [];
  let tonnes = 0;
  let cost = 0;
  for (let i = 0; i < years; i++) {
    const batch = chosen.slice(i * perYear, (i + 1) * perYear);
    if (batch.length === 0) break;
    tonnes += batch.reduce((s, m) => s + m.tonnes, 0);
    cost += batch.reduce((s, m) => s + (m.costDelta ?? 0), 0);
    pathway.push({
      year: now.getFullYear() + i,
      measures: batch,
      cumulativeTonnes: tonnes,
      cumulativePct: baselineTonnes > 0 ? (tonnes / baselineTonnes) * 100 : 0,
      cumulativeCost: cost,
    });
  }
  return { pathway, baselineTonnes, goalTonnes: goal, savedTonnes: saved, reached: saved >= goal };
}
