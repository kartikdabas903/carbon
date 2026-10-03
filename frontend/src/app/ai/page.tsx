"use client";
import { useState } from "react";
import Link from "next/link";
import { AIInput } from "@/components/ai/AIInput";
import { AIResult } from "@/components/ai/AIResult";
import { AIExplanation } from "@/components/ai/AIExplanation";
import { RecommendationCard } from "@/components/ai/RecommendationCard";
import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { predictCarbon } from "@/lib/ai";
import { saveSession } from "@/lib/utils";
import type { AIPrediction, AIRequest } from "@/types/ai";

export default function AIPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AIPrediction | null>(null);

  async function submit(req: AIRequest) {
    setLoading(true);
    setError("");
    try {
      const p = await predictCarbon(req);
      setResult(p);
      saveSession("ai:prediction", p);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
    <h1 className="text-2xl font-semibold tracking-tight text-ink">
      Predict emissions
    </h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <AIInput onSubmit={submit} loading={loading} />
          {error && <div className="mt-3"><ErrorMessage message={error} /></div>}
        </Card>
        <div className="space-y-4">
          {!result && <p className="text-sm text-ink/60">Your prediction will appear here.</p>}
          {result && (
            <>
              <AIResult data={result} />
              <AIExplanation data={result} />
              {result.recommendations.slice(0, 2).map((r) => <RecommendationCard key={r.id} rec={r} />)}
              <Link href="/recommendations" className="text-sm text-moss underline">See all recommendations</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}