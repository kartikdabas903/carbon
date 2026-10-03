"use client";
import { useEffect, useState } from "react";
import { calculateCarbon, getDashboard } from "@/lib/api";
import { getRecommendations, predictCarbon } from "@/lib/ai";
import { CarbonOverview } from "@/components/dashboard/CarbonOverview";
import { CarbonBreakdown } from "@/components/dashboard/CarbonBreakdown";
import { ReductionChart } from "@/components/dashboard/ReductionChart";
import { CarbonInput } from "@/components/carbon/CarbonInput";
import { CarbonResult } from "@/components/carbon/CarbonResult";
import { AIInput } from "@/components/ai/AIInput";
import { AIResult } from "@/components/ai/AIResult";
import { AIExplanation } from "@/components/ai/AIExplanation";
import { RecommendationCard } from "@/components/ai/RecommendationCard";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import type { CarbonInputData, CarbonResultData, DashboardData } from "@/types/carbon";
import type { AIPrediction, AIRecommendation, AIRequest } from "@/types/ai";

export default function Home() {
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [recs, setRecs] = useState<AIRecommendation[]>([]);
  const [calc, setCalc] = useState<CarbonResultData | null>(null);
  const [pred, setPred] = useState<AIPrediction | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [predLoading, setPredLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getDashboard(), getRecommendations()])
      .then(([d, r]) => {
        setDash(d);
        setRecs(r);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function onCalc(d: CarbonInputData) {
    setCalcLoading(true);
    setError("");
    try {
      setCalc(await calculateCarbon(d));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCalcLoading(false);
    }
  }

  async function onPredict(r: AIRequest) {
    setPredLoading(true);
    setError("");
    try {
      setPred(await predictCarbon(r));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPredLoading(false);
    }
  }

  const shownRecs = (pred?.recommendations ?? recs).slice(0, 4);

  return (
    <div className="space-y-8">
      <header className="rounded-2xl bg-gradient-to-br from-forest to-moss p-6 text-white md:p-8">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Know the footprint before it happens.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/70">
          Calculate an activity, predict its emissions, and see what to change first.
        </p>
      </header>

      {error && <ErrorMessage message={error} />}

      {!dash ? (
        !error && <Spinner label="Loading overview" />
      ) : (
        <section className="space-y-4">
          <CarbonOverview totalKg={dash.totalKg} avoidedKg={dash.avoidedKg} />
          <div className="grid gap-4 lg:grid-cols-2">
            <CarbonBreakdown items={dash.breakdown} />
            <ReductionChart data={dash.trend} />
          </div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card title="Calculate emissions">
            <CarbonInput onSubmit={onCalc} loading={calcLoading} />
          </Card>
          {calc && <CarbonResult data={calc} />}
        </div>

        <div className="space-y-4">
          <Card title="Predict an activity">
            <AIInput onSubmit={onPredict} loading={predLoading} />
          </Card>
          {pred && (
            <>
              <AIResult data={pred} />
              <AIExplanation data={pred} />
            </>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">Recommendations</h2>
        {shownRecs.length === 0 ? (
          <p className="text-sm text-ink/60">Run a prediction to get recommendations.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {shownRecs.map((r) => (
              <RecommendationCard key={r.id} rec={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}