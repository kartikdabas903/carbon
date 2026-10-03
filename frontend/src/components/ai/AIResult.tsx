import { Card } from "@/components/ui/Card";
import { fmtKg, fmtPct } from "@/lib/utils";
import type { AIPrediction } from "@/types/ai";

export function AIResult({ data }: { data: AIPrediction }) {
  return (
    <Card title="Predicted emissions">
      <p className="text-4xl font-semibold">{fmtKg(data.predictedKg)} CO₂e</p>
      <p className="mt-1 text-sm text-ink/60">
        <span className="capitalize">{data.category}</span> · {fmtPct(data.confidence)} confidence
      </p>
    </Card>
  );
}