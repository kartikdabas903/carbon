"use client";
import { createElement } from "react";
import { fmtKg } from "@/lib/utils";

/** Round tick step: 1, 2 or 5 x 10^n giving about four ticks. */
export function niceTicks(max: number) {
  const raw = max / 4 || 1;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const ticks = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

// Ticks are round numbers, so skip the decimal: "300 kg", "1.5 t"
export const fmtTick = (t: number) =>
  t === 0 ? "0" : t >= 1000 ? `${+(t / 1000).toFixed(2)} t` : t >= 1 ? `${+t.toFixed(1)} kg` : fmtKg(t);


/** About `count` evenly spaced timestamps between two times, snapped to midnight. */
export function timeTicks(start: number, end: number, count = 4): number[] {
  if (end <= start) return [start];
  const day = 86400e3;
  const ticks = Array.from({ length: count }, (_, i) => start + ((end - start) * i) / (count - 1));
  return [...new Set(ticks.map((t) => Math.round(t / day) * day))].filter((t) => t >= start - day && t <= end + day);
}

/**
 * Recharts `label` renderer that writes the value only at the last point of a line,
 * in ink (not the series colour), nudged by `dy` so two end labels don't collide.
 */
export function endLabel(lastIndex: number, format: (n: number) => string, dy = 0) {
  function EndLabel(props: { index?: number; x?: unknown; y?: unknown; value?: unknown }) {
    if (props.index !== lastIndex || props.value == null) return null;
    return createElement(
      "text",
      { x: Number(props.x) + 8, y: Number(props.y) + dy, dy: "0.32em", fontSize: 11, fontWeight: 600, fill: "var(--ink)" },
      format(Number(props.value))
    );
  }
  return EndLabel;
}
