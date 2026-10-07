"use client";
import { useEffect, useState } from "react";
import { ActivitySelector, ACTIVITIES } from "./ActivitySelector";
import { Button } from "@/components/ui/Button";
import { getFactors } from "@/lib/api";
import type { ActivityCategory, CarbonInputData, FactorInfo } from "@/types/carbon";

// Electricity intensity varies by country; these are the grids the engine knows
const REGIONS = [
  ["", "World average"], ["IN", "India"], ["US", "United States"], ["GB", "United Kingdom"],
  ["EU", "European Union"], ["DE", "Germany"], ["FR", "France"], ["CN", "China"], ["JP", "Japan"],
  ["KR", "South Korea"], ["AU", "Australia"], ["CA", "Canada"], ["BR", "Brazil"], ["ZA", "South Africa"],
  ["SG", "Singapore"],
] as const;

export function CarbonInput({
  onSubmit,
  loading,
}: {
  onSubmit: (d: CarbonInputData) => void;
  loading?: boolean;
}) {
  const [factors, setFactors] = useState<FactorInfo[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [category, setCategory] = useState<ActivityCategory>(ACTIVITIES[0].id);
  const [typeKey, setTypeKey] = useState("");
  const [amount, setAmount] = useState("");
  const [region, setRegion] = useState("");

  useEffect(() => {
    getFactors().then(setFactors).catch((e) => setLoadError(e.message));
  }, []);

  const options = (factors ?? []).filter((f) => f.category === category);
  const factor = options.find((f) => f.key === typeKey) ?? options[0];
  const usesGrid = factor?.kgPerUnit == null && factor?.unit !== "passenger-km";

  if (loadError) return <p className="text-sm text-clay">Could not load activity types: {loadError}</p>;

  return (
    <div className="space-y-4">
      <ActivitySelector value={category} onChange={(a) => { setCategory(a.id); setTypeKey(""); }} />
      <label className="block text-sm">
        Activity
        <select
          value={factor?.key ?? ""}
          onChange={(e) => setTypeKey(e.target.value)}
          disabled={!factors}
          className="field mt-1"
        >
          {!factors && <option>Loading…</option>}
          {options.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
        {factor && (
          <span className="mt-1 block text-xs text-ink/50">
            {factor.kgPerUnit != null ? `${factor.kgPerUnit} kg CO₂e per ${factor.unit}` : "Depends on the electricity grid or flight length"}
            {" · "}Scope {factor.scope} · Source: {factor.source}
          </span>
        )}
      </label>
      <label className="block text-sm">
        Amount{factor ? ` (${factor.unit})` : ""}
        <input
          type="number"
          min={0}
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="field mt-1"
        />
      </label>
      {usesGrid && (
        <label className="block text-sm">
          Country <span className="text-ink/50">(for the electricity mix)</span>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="field mt-1"
          >
            {REGIONS.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </label>
      )}
      <Button
        disabled={loading || !factor || !amount || Number(amount) <= 0}
        onClick={() =>
          factor &&
          onSubmit({
            category,
            amount: Number(amount),
            unit: factor.unit,
            activityType: factor.key,
            ...(usesGrid && region && { region }),
          })
        }
      >
        {loading ? "Calculating" : "Calculate emissions"}
      </Button>
    </div>
  );
}
