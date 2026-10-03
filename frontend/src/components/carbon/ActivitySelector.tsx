"use client";
import { cn } from "@/lib/utils";
import type { Activity, ActivityCategory } from "@/types/carbon";

export const ACTIVITIES: Activity[] = [
  { id: "transport", label: "Transport", unit: "km", hint: "Commutes, fleet trips, travel" },
  { id: "building", label: "Building use", unit: "hours", hint: "Occupied hours, heating, cooling" },
  { id: "electricity", label: "Electricity", unit: "kWh", hint: "Grid demand and peak load" },
  { id: "equipment", label: "Equipment", unit: "hours", hint: "Machinery and device runtime" },
  { id: "resources", label: "Resources", unit: "kg", hint: "Materials, water, consumables" },
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
            "rounded-md border p-3 text-left transition",
            value === a.id ? "border-moss bg-moss/10" : "border-line hover:bg-line/40"
          )}
        >
          <div className="font-medium">{a.label}</div>
          <div className="text-xs text-ink/60">{a.hint}</div>
        </button>
      ))}
    </div>
  );
}