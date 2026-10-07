"use client";
import { useEffect, useRef, useState } from "react";
import { fmtKg } from "@/lib/utils";

/** Round tick step: 1, 2 or 5 x 10^n giving about four ticks. */
export function niceTicks(max: number) {
  const raw = max / 4 || 1;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const ticks = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

// Ticks are round numbers, so skip the decimal: "300 kg", "1.5 t"
export const fmtTick = (t: number) =>
  t === 0 ? "0" : t >= 1000 ? `${+(t / 1000).toFixed(2)} t` : t >= 1 ? `${+t.toFixed(1)} kg` : fmtKg(t);


/** Container ref + its pixel width, so charts draw at real size (text stays 11px on phones). */
export function useWidth(initial = 640): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.round(e.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}
