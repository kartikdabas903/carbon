"use client";
import { useEffect, useState } from "react";
import { RecommendationCard } from "@/components/ai/RecommendationCard";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getRecommendations } from "@/lib/ai";
import type { AIRecommendation } from "@/types/ai";

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<AIRecommendation[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getRecommendations().then(setRecs).catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorMessage message={error} />;
  if (!recs) return <Spinner label="Loading recommendations" />;

  const sorted = [...recs].sort((a, b) => b.savingsKg - a.savingsKg);
  return (
    <div className="space-y-4">
     <h1 className="text-2xl font-semibold tracking-tight text-ink">
      Recommendations
    </h1>
      {sorted.length === 0 && <p className="text-sm text-ink/60">No recommendations yet. Run a prediction first.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {sorted.map((r) => <RecommendationCard key={r.id} rec={r} />)}
      </div>
    </div>
  );
}