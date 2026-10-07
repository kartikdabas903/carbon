import { request } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { HistoryEntry, Choice } from "@/lib/history";

export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.access_token ?? null;
}

async function accountRequest<T>(path: string, init?: RequestInit, tokenOverride?: string): Promise<T> {
  const token = tokenOverride ?? await getAccessToken();
  if (!token) throw new Error("Sign in to sync your CarbonShift data.");
  return request(path, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
  });
}

export function getAccountHistory(token?: string) {
  return accountRequest<HistoryEntry[]>("/api/account/history", undefined, token);
}

export function syncAccountHistory(entries: HistoryEntry[], token?: string) {
  return accountRequest<{ saved: number }>("/api/account/history/sync", {
    method: "POST",
    body: JSON.stringify({ entries }),
  }, token);
}

export function syncAccountChoice(predictionId: string, choice?: Choice) {
  return accountRequest<{ saved: boolean }>("/api/account/choices", {
    method: "PUT",
    body: JSON.stringify({ predictionId, choice: choice ?? null }),
  });
}

export interface AccountGoal {
  reductionPct: number;
  targetYear: number;
}

export function getAccountGoal() {
  return accountRequest<AccountGoal | null>("/api/account/goals");
}

export function saveAccountGoal(goal: AccountGoal) {
  return accountRequest<AccountGoal>("/api/account/goals", {
    method: "PUT",
    body: JSON.stringify(goal),
  });
}

export function deleteAccountHistoryEntry(predictionId: string) {
  return accountRequest<{ deleted: boolean }>(`/api/account/history/${encodeURIComponent(predictionId)}`, { method: "DELETE" });
}

export function clearAccountHistory() {
  return accountRequest<{ deleted: boolean }>("/api/account/history", { method: "DELETE" });
}

export async function getAccountBudget() {
  return accountRequest<{ monthlyBudgetKg: number | null }>("/api/account/budget");
}

export async function saveAccountBudget(monthlyBudgetKg: number) {
  return accountRequest<{ monthlyBudgetKg: number }>("/api/account/budget", {
    method: "PUT",
    body: JSON.stringify({ monthlyBudgetKg }),
  });
}