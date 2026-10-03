import { Card } from "@/components/ui/Card";
import { fmtKg } from "@/lib/utils";
import type { CarbonResultData } from "@/types/carbon";

export function CarbonResult({ data }: { data: CarbonResultData }) {
  const diff = data.baselineKg != null ? data.emissionsKg - data.baselineKg : null;
  return (
    <Card title="Estimated emissions">
      <p className="text-4xl font-semibold">{fmtKg(data.emissionsKg)} CO₂e</p>
      <p className="mt-1 text-sm capitalize text-ink/60">{data.category}</p>
      {diff != null && (
        <p className="mt-3 text-sm">
          {diff > 0 ? `${fmtKg(diff)} above` : `${fmtKg(Math.abs(diff))} below`} your usual baseline.
        </p>
      )}
    </Card>
  );
}