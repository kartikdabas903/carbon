import { Card } from "@/components/ui/Card";
import { fmtKg, fmtMoney, fmtPct } from "@/lib/utils";
import type { AIPrediction } from "@/types/ai";
import { CountUp } from "@/components/ui/CountUp";

export function AIResult({ data }: { data: AIPrediction }) {
  const cost = fmtMoney(data.costEstimate, data.currency);
  return (
    <Card title="Predicted emissions">
      <p className="font-display font-semibold tracking-tight text-forest text-5xl"><CountUp value={data.predictedKg} format={fmtKg} /> <span className="text-2xl text-ink/50">CO₂e</span></p>
      <p className="mt-1 text-sm text-ink/60">
        <span className="capitalize">{data.category}</span> · {fmtPct(data.confidence)} confidence
        {cost && <> · {cost} estimated cost</>}
      </p>

      {!!data.missingInfo?.length && (
        <div className="mt-4 rounded-lg bg-paper p-3 text-sm">
          <p className="font-medium">Estimated from what you gave. Add any of these for a more accurate answer:</p>
          <ul className="mt-1 list-disc pl-5 text-ink/70">
            {data.missingInfo.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {data.liveGrid && (
        <div className="mt-3 rounded-lg border border-line p-3 text-sm">
          <p className="font-medium">Live grid ({data.liveGrid.zone}, last 24 hours)</p>
          <p className="mt-1 text-ink/70">
            Now {Math.round(data.liveGrid.nowG)} g/kWh · cleanest around {data.liveGrid.cleanestHour} {data.liveGrid.timezone} (
            {Math.round(data.liveGrid.cleanestG)} g) · dirtiest around {data.liveGrid.dirtiestHour} ({Math.round(data.liveGrid.dirtiestG)} g).
            {data.liveGrid.dirtiestG > data.liveGrid.cleanestG && (
              <> Running flexible loads at the cleanest time cuts their emissions by about{" "}
                {Math.round((1 - data.liveGrid.cleanestG / data.liveGrid.dirtiestG) * 100)}% versus the dirtiest.</>
            )}
          </p>
          <p className="mt-1 text-[11px] text-ink/40">Source: {data.liveGrid.source}</p>
        </div>
      )}

      {data.timingTip && (
        <p className="mt-3 rounded-lg bg-lime/30 p-3 text-sm">
          <span className="font-medium">Timing tip:</span> {data.timingTip}
        </p>
      )}
    </Card>
  );
}
