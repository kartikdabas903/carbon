"use client";
import { useEffect, useState } from "react";

/** A sprout that grows while we work, with the step we're on. */
export function GrowingLoader({ steps, interval = 1600 }: { steps: string[]; interval?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, steps.length - 1)), interval);
    return () => clearInterval(t);
  }, [steps.length, interval]);

  return (
    <div role="status" aria-live="polite" className="animate-rise flex items-center gap-4 rounded-3xl border border-line/80 bg-surface p-5">
      <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0" aria-hidden>
        <ellipse cx="24" cy="42" rx="14" ry="3" fill="#e3ddcd" />
        <g className="animate-grow" style={{ transformBox: "fill-box", transformOrigin: "bottom center" }}>
          <path d="M24 42V22" stroke="#1f6b4a" strokeWidth="2.5" strokeLinecap="round" />
          <g className="animate-sway" style={{ transformBox: "fill-box", transformOrigin: "bottom center" }}>
            <path d="M24 28c-8 0-12-5-12-11 7 0 12 4 12 11z" fill="#2f8f5b" />
            <path d="M24 24c7 0 11-5 11-10-6 0-11 4-11 10z" fill="#c8e88a" />
          </g>
        </g>
      </svg>
      <div className="min-w-0">
        <p className="font-medium text-forest">{steps[i]}</p>
        <div className="mt-2 flex gap-1.5" aria-hidden>
          {steps.map((_, j) => (
            <span key={j} className={`h-1.5 rounded-full transition-all duration-500 ${j <= i ? "w-6 bg-fern" : "w-3 bg-line"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
