"use client";
import { setChoice, type HistoryEntry } from "@/lib/history";
import { cn, fmtKg } from "@/lib/utils";
import { getAccessToken, syncAccountChoice } from "@/lib/account";
import { useState } from "react";

/** "Which will you do?" Records the user's choice so avoided CO₂ is real, not potential. */
export function ChoicePicker({ entry }: { entry: HistoryEntry }) {
  const [syncError, setSyncError] = useState("");
  const p = entry.prediction;
  const options = [
    { title: "Your plan", kg: p.predictedKg },
    ...p.recommendations.map((r) => ({ title: r.title, kg: Math.max(0, p.predictedKg - r.savingsKg), recommendationId: r.id })),
  ];
  if (options.length < 2) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-medium">Which will you do?</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Which option will you choose">
        {options.map((o) => {
          const active = entry.choice?.title === o.title;
          const nextChoice = active ? undefined : o;
          return (
            <button
              key={o.title}
              role="radio"
              aria-checked={active}
              disabled={syncError === "saving"}
              onClick={() => {
                setSyncError("saving");
                void getAccessToken().then((token) => {
                  if (!token) throw new Error("Sign in to save this choice.");
                  return syncAccountChoice(entry.id, nextChoice);
                }).then(() => setChoice(entry.id, nextChoice))
                  .then(() => setSyncError(""))
                  .catch((error: Error) => setSyncError(error.message));
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition",
                active ? "border-moss bg-moss text-white" : "border-line hover:bg-line/40"
              )}
            >
              {active && "✓ "}
              {o.title} · {fmtKg(o.kg)}
            </button>
          );
        })}
      </div>
      {syncError && <p role="status" className="mt-2 text-xs text-clay">{syncError === "saving" ? "Saving your choice…" : syncError}</p>}
      {entry.choice && entry.choice.kg < p.predictedKg && (
        <p className="mt-2 text-sm text-moss">You avoided {fmtKg(p.predictedKg - entry.choice.kg)} with this choice.</p>
      )}
    </div>
  );
}
