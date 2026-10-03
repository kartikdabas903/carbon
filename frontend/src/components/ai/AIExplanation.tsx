import { Card } from "@/components/ui/Card";
import type { AIPrediction } from "@/types/ai";

export function AIExplanation({ data }: { data: Pick<AIPrediction, "explanation" | "factors"> }) {
  const max = Math.max(...data.factors.map((f) => Math.abs(f.impact)), 0.01);
  return (
    <Card title="Why this prediction">
      <p className="mb-4 text-sm leading-relaxed">{data.explanation}</p>
      <ul className="space-y-2">
        {data.factors.map((f) => (
          <li key={f.name} className="text-sm">
            <div className="flex justify-between">
              <span>{f.name}</span>
              <span className="text-ink/60">{f.impact > 0 ? "+" : ""}{Math.round(f.impact * 100)}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded bg-line">
              <div
                className={f.impact > 0 ? "h-full rounded bg-clay" : "h-full rounded bg-moss"}
                style={{ width: `${(Math.abs(f.impact) / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}