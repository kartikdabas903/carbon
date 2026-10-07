import { useSyncExternalStore } from "react";
import { committedKg, type HistoryEntry } from "@/lib/history";

// 1.5 °C-aligned lifestyle budget for 2030: 2.5 t per person per year (Hot or Cool Institute)
export const DEFAULT_MONTHLY_KG = Math.round(2500 / 12);
let monthlyBudgetKg = DEFAULT_MONTHLY_KG;
let budgetUserId: string | null = null;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function read(): number {
  return monthlyBudgetKg;
}

/** Monthly budget in kg; null during server rendering. */
export function useBudget(): number | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function setBudget(kg: number) {
  monthlyBudgetKg = kg;
  listeners.forEach((l) => l());
}

export function setBudgetUser(userId: string | null) {
  if (budgetUserId === userId) return;
  budgetUserId = userId;
  monthlyBudgetKg = DEFAULT_MONTHLY_KG;
  listeners.forEach((listener) => listener());
}

/** Committed emissions from entries created in the current calendar month. */
export function usedThisMonth(history: HistoryEntry[], now = new Date()) {
  return history
    .filter((e) => {
      const d = new Date(e.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, e) => sum + committedKg(e), 0);
}
