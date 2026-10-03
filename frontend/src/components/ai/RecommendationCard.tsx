import { Card } from "@/components/ui/Card";
import { fmtKg } from "@/lib/utils";
import type { AIRecommendation } from "@/types/ai";

export function RecommendationCard({ rec }: { rec: AIRecommendation }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium">{rec.title}</h3>
        <span className="shrink-0 rounded bg-moss/10 px-2 py-0.5 text-sm text-moss">
          −{fmtKg(rec.savingsKg)}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink/70">{rec.description}</p>
      <p className="mt-2 text-xs text-ink/50">
        <span className="capitalize">{rec.category}</span> · {rec.effort} effort
      </p>
    </Card>
  );
}