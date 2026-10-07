import type { CarbonInputData, CarbonResultData, DashboardData, FactorInfo } from "@/types/carbon";
import { mockCalculate, mockDashboard } from "./mock";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
export const wait = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers({ "Content-Type": "application/json" });
  new Headers(init?.headers).forEach((value, key) => headers.set(key, value));
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // FastAPI errors carry a user-facing message in `detail`
    let detail: unknown;
    try {
      detail = JSON.parse(text).detail;
    } catch {}
    if (typeof detail === "string") throw new Error(detail);
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

export async function calculateCarbon(data: CarbonInputData, accessToken?: string): Promise<CarbonResultData> {
  if (USE_MOCK) {
    await wait();
    return mockCalculate(data);
  }
  return request("/api/calculate", {
    method: "POST",
    body: JSON.stringify(data),
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
}

export async function getFactors(): Promise<FactorInfo[]> {
  return request("/api/factors");
}

export async function getDashboard(): Promise<DashboardData> {
  if (USE_MOCK) {
    await wait();
    return mockDashboard;
  }
  return request("/api/dashboard");
}