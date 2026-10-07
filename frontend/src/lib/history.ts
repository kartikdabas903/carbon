import { useMemo, useSyncExternalStore } from "react";
import type { AIPrediction, AIRecommendation, AIRequest } from "@/types/ai";
import type { CarbonInputData, CarbonResultData } from "@/types/carbon";

// This is an in-memory view cache only; the database is the source of truth.
export interface HistoryEntry {
  id: string;
  createdAt: string;
  request: AIRequest;
  prediction: AIPrediction;
  kind?: "prediction" | "calculation"; // missing on entries saved before calculations were tracked
  choice?: Choice; // what the user said they'll actually do
}

export interface Choice {
  title: string; // "Your plan" or a recommendation title
  kg: number;
  recommendationId?: string;
}

/** Emissions the user is committed to: their choice if made, else the prediction. */
export const committedKg = (e: HistoryEntry) => e.choice?.kg ?? e.prediction.predictedKg;

const MAX_ENTRIES = 50;
let activeUserId: string | null = null;
let historyCache: HistoryEntry[] = [];

export const EFFORT_WEIGHT: Record<AIRecommendation["effort"], number> = { low: 1, medium: 0.75, high: 0.4 };

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readRaw(): string {
  return JSON.stringify(historyCache);
}

function parse(raw: string): HistoryEntry[] {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function loadHistory(): HistoryEntry[] {
  return parse(readRaw());
}

export function setHistoryUser(userId: string | null) {
  if (activeUserId === userId) return;
  activeUserId = userId;
  historyCache = [];
  listeners.forEach((listener) => listener());
}

export function mergeHistory(entries: HistoryEntry[]) {
  const merged = new Map(loadHistory().map((entry) => [entry.id, entry]));
  for (const entry of entries) merged.set(entry.id, entry);
  save([...merged.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, MAX_ENTRIES));
}

/** History entries, newest first; null during server rendering. */
export function useHistory(): HistoryEntry[] | null {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return useMemo(() => (raw === null ? null : parse(raw)), [raw]);
}

function save(entries: HistoryEntry[]) {
  historyCache = entries;
  listeners.forEach((l) => l());
}

export function createHistoryEntry(
  request: AIRequest,
  prediction: AIPrediction,
  kind: HistoryEntry["kind"] = "prediction"
): HistoryEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    request,
    prediction,
    kind,
  };
}

export function cacheHistoryEntry(entry: HistoryEntry) {
  save([entry, ...loadHistory().filter((item) => item.id !== entry.id)].slice(0, MAX_ENTRIES));
}

export function setChoice(id: string, choice: Choice | undefined) {
  save(loadHistory().map((e) => (e.id === id ? { ...e, choice } : e)));
}

export function createCalculationEntry(input: CarbonInputData, result: CarbonResultData): HistoryEntry {
  const scope = result.scope ?? 3;
  return createHistoryEntry(
    { prompt: `${result.label || input.activityType}: ${input.amount} ${input.unit}` },
    {
      predictedKg: result.emissionsKg,
      confidence: 0.95,
      category: result.category,
      explanation: result.working || "",
      factors: [],
      recommendations: [],
      scopes: { scope1: 0, scope2: 0, scope3: 0, [`scope${scope}`]: result.emissionsKg },
    },
    "calculation"
  );
}

export function removeHistory(id: string) {
  save(loadHistory().filter((e) => e.id !== id));
}

export function clearHistory() {
  save([]);
}

export interface RankedRecommendation extends AIRecommendation {
  source: string;
  currency?: string | null;
}

/** Best recommendations across the history: one per title, ranked by savings discounted by effort. */
export function rankRecommendations(entries: HistoryEntry[]): RankedRecommendation[] {
  const best = new Map<string, RankedRecommendation>();
  for (const e of entries) {
    for (const r of e.prediction.recommendations) {
      const key = r.title.trim().toLowerCase();
      const current = best.get(key);
      if (!current || r.savingsKg > current.savingsKg) best.set(key, { ...r, source: e.request.prompt, currency: e.prediction.currency });
    }
  }
  const score = (r: AIRecommendation) => r.savingsKg * EFFORT_WEIGHT[r.effort];
  return [...best.values()].sort((a, b) => score(b) - score(a));
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
