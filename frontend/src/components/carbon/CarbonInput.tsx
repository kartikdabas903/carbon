"use client";
import { useState } from "react";
import { ActivitySelector, ACTIVITIES } from "./ActivitySelector";
import { Button } from "@/components/ui/Button";
import type { Activity, CarbonInputData } from "@/types/carbon";

export function CarbonInput({
  onSubmit,
  loading,
}: {
  onSubmit: (d: CarbonInputData) => void;
  loading?: boolean;
}) {
  const [activity, setActivity] = useState<Activity>(ACTIVITIES[0]);
  const [amount, setAmount] = useState("");
  const [detail, setDetail] = useState("");

  return (
    <div className="space-y-4">
      <ActivitySelector value={activity.id} onChange={setActivity} />
      <label className="block text-sm">
        Amount ({activity.unit})
        <input
          type="number"
          min={0}
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-md border border-line px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Details (optional)
        <input
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="e.g. diesel van, 8 passengers"
          className="mt-1 w-full rounded-md border border-line px-3 py-2"
        />
      </label>
      <Button
        disabled={loading || !amount || Number(amount) <= 0}
        onClick={() =>
          onSubmit({ category: activity.id, amount: Number(amount), unit: activity.unit, detail: detail || undefined })
        }
      >
        {loading ? "Calculating" : "Calculate emissions"}
      </Button>
    </div>
  );
}