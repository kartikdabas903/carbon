import { Card } from "@/components/ui/Card";
import { fmtKg } from "@/lib/utils";

export function CarbonOverview({ totalKg, avoidedKg }: { totalKg: number; avoidedKg: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card title="Total emissions">
        <p className="text-3xl font-semibold">{fmtKg(totalKg)}</p>
      </Card>
      <Card title="Avoided with CarbonFlow">
        <p className="text-3xl font-semibold text-moss">{fmtKg(avoidedKg)}</p>
      </Card>
    </div>
  );
}