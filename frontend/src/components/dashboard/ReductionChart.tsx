import { Card } from "@/components/ui/Card";
import type { TrendPoint } from "@/types/carbon";

// Dependency-free SVG line chart: actual vs. reduced emissions.
export function ReductionChart({ data }: { data: TrendPoint[] }) {
  const W = 600, H = 220, P = 28;
  if (data.length < 2) return <Card title="Reduction trend"><p className="text-sm text-ink/60">Not enough data yet.</p></Card>;
  const max = Math.max(...data.flatMap((d) => [d.actualKg, d.reducedKg])) || 1;
  const x = (i: number) => P + (i * (W - 2 * P)) / (data.length - 1);
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const path = (k: "actualKg" | "reducedKg") =>
    data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d[k])}`).join(" ");
  return (
    <Card title="Reduction trend">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Actual versus reduced emissions over time">
        <path d={path("actualKg")} fill="none" stroke="var(--clay)" strokeWidth="2" />
        <path d={path("reducedKg")} fill="none" stroke="var(--moss)" strokeWidth="2" />
        {data.map((d, i) => (
          <text key={d.date} x={x(i)} y={H - 8} fontSize="10" textAnchor="middle" fill="currentColor" opacity=".5">
            {d.date}
          </text>
        ))}
      </svg>
      <p className="mt-2 flex gap-4 text-xs">
        <span className="text-clay">Actual</span>
        <span className="text-moss">With recommendations</span>
      </p>
    </Card>
  );
}