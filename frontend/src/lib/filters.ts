import { avoidedKg, isDone, isPlanned, PLAN_TITLE, type HistoryEntry } from "@/lib/history";
import { bestSaving } from "@/lib/stats";
import type { ActivityCategory } from "@/types/carbon";

export type SortKey =
  | "newest"
  | "oldest"
  | "kg-desc"
  | "kg-asc"
  | "saving-desc"
  | "avoided-desc"
  | "confidence-desc"
  | "cost-desc"
  | "category";

export interface HistoryFilter {
  q: string;
  kind: "all" | "prediction" | "calculation";
  category: "all" | ActivityCategory;
  scope: "all" | "1" | "2" | "3";
  period: "all" | "today" | "7d" | "30d" | "month";
  size: "all" | "small" | "medium" | "large" | "huge";
  choice: "all" | "done" | "planned" | "kept" | "open";
  sort: SortKey;
}

export const DEFAULT_FILTER: HistoryFilter = {
  q: "",
  kind: "all",
  category: "all",
  scope: "all",
  period: "all",
  size: "all",
  choice: "all",
  sort: "newest",
};

export const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  "kg-desc": "Emissions: high to low",
  "kg-asc": "Emissions: low to high",
  "saving-desc": "Potential saving: high to low",
  "avoided-desc": "CO₂ avoided by your choice",
  "confidence-desc": "Confidence: high to low",
  "cost-desc": "Estimated cost: high to low",
  category: "Category (A–Z)",
};

export const SIZE_LABELS: Record<Exclude<HistoryFilter["size"], "all">, string> = {
  small: "Under 10 kg",
  medium: "10–100 kg",
  large: "100 kg – 1 t",
  huge: "Over 1 t",
};

export const PERIOD_LABELS: Record<Exclude<HistoryFilter["period"], "all">, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
};

export const CHOICE_LABELS: Record<Exclude<HistoryFilter["choice"], "all">, string> = {
  done: "Greener option done",
  planned: "Planned, not confirmed",
  kept: "Kept the original plan",
  open: "Not answered yet",
};

const DAY = 24 * 3600 * 1000;

function inPeriod(iso: string, period: HistoryFilter["period"], now: Date) {
  const t = new Date(iso);
  switch (period) {
    case "today":
      return t.toDateString() === now.toDateString();
    case "7d":
      return now.getTime() - t.getTime() <= 7 * DAY;
    case "30d":
      return now.getTime() - t.getTime() <= 30 * DAY;
    case "month":
      return t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth();
    default:
      return true;
  }
}

function inSize(kg: number, size: HistoryFilter["size"]) {
  switch (size) {
    case "small":
      return kg < 10;
    case "medium":
      return kg >= 10 && kg < 100;
    case "large":
      return kg >= 100 && kg < 1000;
    case "huge":
      return kg >= 1000;
    default:
      return true;
  }
}

const avoided = avoidedKg;

const SORTERS: Record<SortKey, (a: HistoryEntry, b: HistoryEntry) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  "kg-desc": (a, b) => b.prediction.predictedKg - a.prediction.predictedKg,
  "kg-asc": (a, b) => a.prediction.predictedKg - b.prediction.predictedKg,
  "saving-desc": (a, b) => bestSaving(b) - bestSaving(a),
  "avoided-desc": (a, b) => avoided(b) - avoided(a),
  "confidence-desc": (a, b) => b.prediction.confidence - a.prediction.confidence,
  // Unknown costs sort last
  "cost-desc": (a, b) => (b.prediction.costEstimate ?? -1) - (a.prediction.costEstimate ?? -1),
  category: (a, b) => a.prediction.category.localeCompare(b.prediction.category) || b.createdAt.localeCompare(a.createdAt),
};

export function applyFilter(history: HistoryEntry[], f: HistoryFilter, now = new Date()): HistoryEntry[] {
  const q = f.q.trim().toLowerCase();
  return history
    .filter((e) => {
      const p = e.prediction;
      if (q && !`${e.request.prompt} ${p.explanation} ${p.recommendations.map((r) => r.title).join(" ")}`.toLowerCase().includes(q))
        return false;
      if (f.kind !== "all" && (e.kind ?? "prediction") !== f.kind) return false;
      if (f.category !== "all" && p.category !== f.category) return false;
      if (f.scope !== "all" && !(p.scopes && p.scopes[`scope${f.scope}`] > 0)) return false;
      if (!inPeriod(e.createdAt, f.period, now)) return false;
      if (!inSize(p.predictedKg, f.size)) return false;
      if (f.choice === "done" && !(isDone(e.choice) && e.choice!.title !== PLAN_TITLE)) return false;
      if (f.choice === "planned" && !isPlanned(e.choice)) return false;
      if (f.choice === "kept" && e.choice?.title !== PLAN_TITLE) return false;
      if (f.choice === "open" && (e.choice || e.kind === "calculation" || p.recommendations.length === 0)) return false;
      return true;
    })
    .sort(SORTERS[f.sort]);
}

export const isFiltered = (f: HistoryFilter) =>
  (Object.keys(DEFAULT_FILTER) as (keyof HistoryFilter)[]).some((k) => k !== "sort" && f[k] !== DEFAULT_FILTER[k]);

/** Plain-language summary of active filters, for report headers. */
export function describeFilter(f: HistoryFilter): string {
  const parts: string[] = [];
  if (f.q.trim()) parts.push(`matching "${f.q.trim()}"`);
  if (f.kind !== "all") parts.push(f.kind === "prediction" ? "predictions only" : "calculations only");
  if (f.category !== "all") parts.push(`category: ${f.category}`);
  if (f.scope !== "all") parts.push(`with Scope ${f.scope} emissions`);
  if (f.period !== "all") parts.push(PERIOD_LABELS[f.period].toLowerCase());
  if (f.size !== "all") parts.push(SIZE_LABELS[f.size].toLowerCase());
  if (f.choice !== "all") parts.push(CHOICE_LABELS[f.choice].toLowerCase());
  return parts.join(" · ");
}

