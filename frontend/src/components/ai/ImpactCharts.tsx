import { BarChart } from "@/components/charts/BarChart";
import { Card } from "@/components/ui/Card";
import { equivalents, offsetCostUsd, SCOPE_LABEL } from "@/lib/stats";
import { fmtKg } from "@/lib/utils";
import type { AIPrediction } from "@/types/ai";
import { CountUp } from "@/components/ui/CountUp";

const usd = (n: number) => (n < 1 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.round(n).toLocaleString());

const fmtCount = (n: number) => (n >= 100 ? Math.round(n).toLocaleString() : n >= 10 ? n.toFixed(0) : n.toFixed(1));

/** What the prediction means in everyday terms, and how the options compare. */
export function ImpactCharts({ data }: { data: AIPrediction }) {
  const scopes = data.scopes;
  const offset = offsetCostUsd(data.predictedKg);
  return (
    <>
      <Card title="What that equals">
        <div className="grid gap-3 sm:grid-cols-3">
          {equivalents(data.predictedKg).map((e) => (
            <div key={e.label}>
              <p className="font-display font-semibold tracking-tight text-forest text-3xl"><CountUp value={e.value} format={fmtCount} /></p>
              <p className="text-xs text-ink/60">{e.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-ink/60">
          If it can&apos;t be avoided, offsetting it would cost roughly ${usd(offset.low)}–${usd(offset.high)} with typical
          carbon credits, or about ${usd(offset.removal)} with durable removals (e.g. biochar). Reduce first; offset last.
        </p>
        {scopes && (
          <p className="mt-4 text-xs text-ink/60">
            {([1, 2, 3] as const)
              .filter((s) => scopes[`scope${s}`] > 0)
              .map((s) => `${SCOPE_LABEL[s]}: ${fmtKg(scopes[`scope${s}`])}`)
              .join(" · ")}
          </p>
        )}
      </Card>

      {data.recommendations.length > 0 && (
        <Card title="Your plan vs alternatives">
          <BarChart
            legend={[
              { name: "Your plan", color: "var(--chart-planned)" },
              { name: "Alternative", color: "var(--chart-reduced)" },
            ]}
            rows={[
              { key: "plan", label: "Your plan", segments: [{ name: "Emissions", value: data.predictedKg, color: "var(--chart-planned)" }] },
              ...data.recommendations.map((r) => ({
                key: r.id,
                label: r.title,
                segments: [{ name: "Emissions", value: Math.max(0, data.predictedKg - r.savingsKg), color: "var(--chart-reduced)" }],
              })),
            ]}
          />
        </Card>
      )}
    </>
  );
}
