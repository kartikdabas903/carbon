import { Card } from "@/components/ui/Card";
import { fmtKg } from "@/lib/utils";
import type { CarbonResultData } from "@/types/carbon";
import { CountUp } from "@/components/ui/CountUp";

export function CarbonResult({ data }: { data: CarbonResultData }) {
  return (
    <Card title="Estimated emissions">
      <p className="font-display font-semibold tracking-tight text-forest text-5xl"><CountUp value={data.emissionsKg} format={fmtKg} /> <span className="text-2xl text-ink/50">CO₂e</span></p>
      <p className="mt-1 text-sm text-ink/60">
        <span className="capitalize">{data.category}</span>
        {data.scope && <> · Scope {data.scope}</>}
      </p>
      {data.working && <p className="mt-3 text-sm leading-relaxed">{data.working}</p>}
    </Card>
  );
}
