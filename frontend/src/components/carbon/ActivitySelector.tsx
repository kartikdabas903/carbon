"use client";
import { cn } from "@/lib/utils";
import type { Activity, ActivityCategory } from "@/types/carbon";

export const ACTIVITIES: Activity[] = [
  { id: "transport", label: "Transport", unit: "km", hint: "Cars, public transport, flights, freight" },
  { id: "building", label: "Building & fuels", unit: "kWh", hint: "Gas, LPG, oil, coal, refrigerants, hotels" },
  { id: "electricity", label: "Electricity", unit: "kWh", hint: "Grid power, appliances, generators" },
  { id: "equipment", label: "Equipment", unit: "device", hint: "New laptops, phones and other devices" },
  { id: "resources", label: "Food, waste & materials", unit: "kg", hint: "Food, waste, water, paper, plastic, steel" },
];

export function ActivitySelector({
  value,
  onChange,
}: {
  value: ActivityCategory;
  onChange: (a: Activity) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Activity" className="grid gap-2 sm:grid-cols-2">
      {ACTIVITIES.map((a) => (
        <button
          key={a.id}
          type="button"
          role="radio"
          aria-checked={value === a.id}
          onClick={() => onChange(a)}
          className={cn(
            "rounded-2xl border p-3.5 text-left transition",
            value === a.id ? "border-fern bg-sage/70 ring-1 ring-fern/30" : "border-line bg-surface hover:border-fern/40 hover:bg-sage/40"
          )}
        >
          <div className="font-medium">{a.label}</div>
          <div className="text-xs text-ink/60">{a.hint}</div>
        </button>
      ))}
    </div>
  );
}