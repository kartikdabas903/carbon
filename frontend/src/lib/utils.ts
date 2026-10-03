export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export const fmtKg = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(2)} t` : `${n.toFixed(1)} kg`;

export const fmtPct = (n: number) => `${Math.round(n * 100)}%`;

export function saveSession<T>(key: string, value: T) {
  if (typeof window !== "undefined") sessionStorage.setItem(key, JSON.stringify(value));
}

export function loadSession<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : null;
}