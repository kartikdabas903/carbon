import { committedKg, type HistoryEntry } from "@/lib/history";
import { bestSaving } from "@/lib/stats";

// Decisions bigger than this (building a house, a conference) are treated as
// one-offs: counted once, never extrapolated into the future.
export const ONE_OFF_KG = 1000;
// Project at least over a month, so a single busy day isn't extrapolated for years
const MIN_WINDOW_DAYS = 30;
export const PROJECT_TO = new Date(2030, 11, 31);
const DAY = 24 * 3600 * 1000;

export interface GhostPoint {
  at: number; // ms timestamp
  youKg: number;
  ghostKg: number;
  label: string;
}

export interface Divergence {
  entry: HistoryEntry;
  ghostTook: string;
  gapKg: number;
}

/** What "Ghost You" emits for one decision: always the best recommendation. */
export const ghostKg = (e: HistoryEntry) => Math.min(committedKg(e), e.prediction.predictedKg - bestSaving(e));

export function ghostTimeline(history: HistoryEntry[], now = new Date()) {
  const entries = [...history].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const points: GhostPoint[] = [];
  let you = 0;
  let ghost = 0;
  for (const e of entries) {
    you += committedKg(e);
    ghost += ghostKg(e);
    points.push({ at: new Date(e.createdAt).getTime(), youKg: you, ghostKg: ghost, label: e.request.prompt });
  }

  // Daily rates from everyday (non one-off) decisions
  const firstAt = points[0]?.at ?? now.getTime();
  const windowDays = Math.max(MIN_WINDOW_DAYS, (now.getTime() - firstAt) / DAY);
  const everyday = entries.filter((e) => e.prediction.predictedKg <= ONE_OFF_KG);
  const youRate = everyday.reduce((s, e) => s + committedKg(e), 0) / windowDays;
  const ghostRate = everyday.reduce((s, e) => s + ghostKg(e), 0) / windowDays;
  const daysLeft = Math.max(0, (PROJECT_TO.getTime() - now.getTime()) / DAY);

  const end = { at: PROJECT_TO.getTime(), youKg: you + youRate * daysLeft, ghostKg: ghost + ghostRate * daysLeft };
  const divergences: Divergence[] = entries
    .map((e) => {
      const best = [...e.prediction.recommendations].sort((a, b) => b.savingsKg - a.savingsKg)[0];
      return { entry: e, ghostTook: best?.title ?? "", gapKg: committedKg(e) - ghostKg(e) };
    })
    .filter((d) => d.gapKg > 0.01 && d.ghostTook)
    .sort((a, b) => b.gapKg - a.gapKg);

  const avoidable = entries.reduce((s, e) => s + (e.prediction.predictedKg - ghostKg(e)), 0);
  const avoided = entries.reduce((s, e) => s + (e.prediction.predictedKg - committedKg(e)), 0);

  return {
    points,
    now: { at: now.getTime(), youKg: you, ghostKg: ghost },
    end,
    gapNowKg: you - ghost,
    gap2030Kg: end.youKg - end.ghostKg,
    oneOffs: entries.length - everyday.length,
    // Share of the possible savings you've actually taken by choosing
    closedPct: avoidable > 0 ? (avoided / avoidable) * 100 : null,
    divergences,
  };
}
