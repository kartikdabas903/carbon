import { Card } from "@/components/ui/Card";
import { fmtKg, fmtMoney } from "@/lib/utils";
import type { AIRecommendation } from "@/types/ai";

export function RecommendationCard({
  rec,
  source,
  currency,
}: {
  rec: AIRecommendation;
  source?: string;
  currency?: string | null;
}) {
  const cost = fmtMoney(rec.cost, currency);
  return (
    <Card className="animate-rise transition duration-300 hover:-translate-y-0.5 hover:border-fern/40 hover:shadow-[0_18px_36px_-24px_rgba(15,42,31,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold leading-snug text-forest">{rec.title}</h3>
        <span className="shrink-0 rounded-full bg-sprout px-2.5 py-1 text-sm font-semibold text-forest">
          −{fmtKg(rec.savingsKg)}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink/70">{rec.description}</p>
      <p className="mt-2 text-xs text-ink/50">
        <span className="capitalize">{rec.category}</span> · {rec.effort} effort
        {cost && <> · {cost}</>}
      </p>
      {source && <p className="mt-1 truncate text-xs text-ink/50">For: {source}</p>}
    </Card>
  );
}