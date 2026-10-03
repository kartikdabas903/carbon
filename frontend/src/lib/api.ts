import type { CarbonInputData, CarbonResultData, DashboardData } from "@/types/carbon";
import { mockCalculate, mockDashboard } from "./mock";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
export const wait = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

export async function calculateCarbon(data: CarbonInputData): Promise<CarbonResultData> {
  if (USE_MOCK) {
    await wait();
    return mockCalculate(data);
  }
  return request("/api/calculate", { method: "POST", body: JSON.stringify(data) });
}

export async function getDashboard(): Promise<DashboardData> {
  if (USE_MOCK) {
    await wait();
    return mockDashboard;
  }
  return request("/api/dashboard");
}