"use client";
import Link from "next/link";
import { useState } from "react";
import { RecommendationCard } from "@/components/ai/RecommendationCard";
import { EFFORT_WEIGHT, rankRecommendations, useHistory, type RankedRecommendation } from "@/lib/history";
import { fmtKg } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

type RecSort = "best" | "saving" | "easiest" | "cheapest" | "category";

const SORTS: Record<RecSort, { label: string; compare: (a: RankedRecommendation, b: RankedRecommendation) => number }> = {
  best: { label: "Best overall (saving × ease)", compare: () => 0 }, // rankRecommendations' own order
  saving: { label: "Biggest CO₂ saving", compare: (a, b) => b.savingsKg - a.savingsKg },
  easiest: {
    label: "Easiest first",
    compare: (a, b) => EFFORT_WEIGHT[b.effort] - EFFORT_WEIGHT[a.effort] || b.savingsKg - a.savingsKg,
  },
  // Options without a cost estimate go last
  cheapest: { label: "Cheapest first", compare: (a, b) => (a.cost ?? Infinity) - (b.cost ?? Infinity) },
  category: { label: "Category (A–Z)", compare: (a, b) => a.category.localeCompare(b.category) || b.savingsKg - a.savingsKg },
};

const selectClass = "field mt-1 block py-1.5 text-sm";

export default function RecommendationsPage() {
  const history = useHistory();
  const [sort, setSort] = useState<RecSort>("best");
  const [category, setCategory] = useState("all");
  const [effort, setEffort] = useState("all");
  const [showAll, setShowAll] = useState(false);
  if (!history) return null;

  const all = rankRecommendations(history);
  const matching = all
    .filter((r) => (category === "all" || r.category === category) && (effort === "all" || r.effort === effort))
    .sort(SORTS[sort].compare);
  const visible = showAll ? matching : matching.slice(0, 10);
  // Recommendations for the same activity are either/or, so count the best one per activity
  const bestPerActivity = new Map<string, number>();
  for (const r of matching) bestPerActivity.set(r.source, Math.max(bestPerActivity.get(r.source) ?? 0, r.savingsKg));
  const potentialKg = [...bestPerActivity.values()].reduce((s, kg) => s + kg, 0);
  const categories = [...new Set(all.map((r) => r.category))].sort();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Track" icon="bulb" title="Recommendations" description="The best changes from all your decisions, ranked by CO₂ saved and how easy they are." />
      {all.length === 0 ? (
        <p className="text-sm">
          No recommendations yet. <Link href="/ai" className="text-moss underline">Run a prediction</Link> and the best
          changes for your activities will appear here.
        </p>
      ) : (
        <>
          <div className="grid gap-3 rounded-3xl border border-line/80 bg-surface p-4 sm:grid-cols-3">
            <label className="text-xs text-ink/60">
              Sort by
              <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as RecSort)} className={selectClass}>
                {(Object.keys(SORTS) as RecSort[]).map((k) => (
                  <option key={k} value={k}>{SORTS[k].label}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-ink/60">
              Category
              <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-ink/60">
              Effort
              <select aria-label="Effort" value={effort} onChange={(e) => setEffort(e.target.value)} className={selectClass}>
                <option value="all">Any effort</option>
                <option value="low">Low effort</option>
                <option value="medium">Medium effort</option>
                <option value="high">High effort</option>
              </select>
            </label>
          </div>
          <p className="text-sm text-ink/60" aria-live="polite">
            {matching.length} recommendation{matching.length === 1 ? "" : "s"} from your {history.length} decisions.
            Taking the best change for each activity would save {fmtKg(potentialKg)}.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((r) => <RecommendationCard key={r.id} rec={r} source={r.source} currency={r.currency} />)}
          </div>
          {matching.length > 10 && (
            <button onClick={() => setShowAll(!showAll)} className="text-sm text-moss underline">
              {showAll ? "Show top 10" : `Show all ${matching.length}`}
            </button>
          )}
          <Link href="/result" className="block text-sm text-moss underline">See them alongside your prediction history</Link>
        </>
      )}
    </div>
  );
}
