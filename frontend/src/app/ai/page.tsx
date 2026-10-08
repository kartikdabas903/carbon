"use client";
import { Suspense, useEffect, useEffectEvent, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AIInput } from "@/components/ai/AIInput";
import { PredictionFollowup } from "@/components/ai/PredictionFollowup";
import { AIResult } from "@/components/ai/AIResult";
import { AIExplanation } from "@/components/ai/AIExplanation";
import { BreakdownTable } from "@/components/ai/BreakdownTable";
import { ChoicePicker } from "@/components/ai/ChoicePicker";
import { RecommendationCard } from "@/components/ai/RecommendationCard";
import { TripOptions } from "@/components/ai/TripOptions";
import { ImpactCharts } from "@/components/ai/ImpactCharts";
import { RouteMap } from "@/components/map/RouteMap";
import { TravelLinks } from "@/components/map/TravelLinks";
import { BudgetMeter } from "@/components/dashboard/BudgetMeter";
import { Card } from "@/components/ui/Card";
import { GrowingLoader } from "@/components/ui/GrowingLoader";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { askAboutPrediction, predictCarbon } from "@/lib/ai";
import { cacheHistoryEntry, committedKg, createHistoryEntry, useHistory } from "@/lib/history";
import type { AIPrediction, AIRequest } from "@/types/ai";
import { getAccessToken, syncAccountHistory } from "@/lib/account";
import { fmtKg } from "@/lib/utils";

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const LOADING_STEPS = [
  "Reading your plan",
  "Finding real routes and distances",
  "Checking official emission factors",
  "Comparing lower-carbon options",
];

export default function AIPage() {
  // useSearchParams needs a Suspense boundary in the App Router
  return (
    <Suspense fallback={null}>
      <Predict />
    </Suspense>
  );
}

function Predict() {
  const history = useHistory();
  const initialPrompt = useSearchParams().get("q") ?? "";
  const autoRan = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AIPrediction | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [syncWarning, setSyncWarning] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const entry = history?.find((e) => e.id === entryId);

  function conversationContext(contextTurns: ChatTurn[]) {
    return contextTurns.slice(-8).map((turn) => `${turn.role}: ${turn.text}`).join("\n").slice(-3000);
  }

  async function predictAndSave(req: AIRequest, contextTurns: ChatTurn[]) {
    const accessToken = await getAccessToken();
    if (!accessToken) throw new Error("Sign in to save and revise predictions.");
    const p = await predictCarbon({ ...req, conversationContext: conversationContext(contextTurns) }, accessToken);
    const historyRequest = { ...req };
    delete historyRequest.conversationContext;
    const historyEntry = createHistoryEntry(historyRequest, p);
    await syncAccountHistory([historyEntry], accessToken);
    cacheHistoryEntry(historyEntry);
    setResult(p);
    setEntryId(historyEntry.id);
    return p;
  }

  async function submit(req: AIRequest) {
    const userTurn: ChatTurn = { id: `${Date.now()}-user`, role: "user", text: req.prompt };
    const nextTurns = [...turns, userTurn];
    setTurns(nextTurns);
    setLoading(true);
    setError("");
    setSyncWarning("");
    try {
      const p = await predictAndSave(req, nextTurns.slice(0, -1));
      const top = p.recommendations[0];
      const reply = `Estimated ${fmtKg(p.predictedKg)} CO₂e with ${Math.round(p.confidence * 100)}% confidence.${top ? ` A practical next step is “${top.title}”, saving about ${fmtKg(top.savingsKg)}.` : " No practical lower-carbon alternative stood out."} Ask a question below or request a change to this plan.`;
      setTurns([...nextTurns, { id: `${Date.now()}-assistant`, role: "assistant", text: reply }]);
    } catch (e) {
      setError((e as Error).message);
      setTurns(turns);
    } finally {
      setLoading(false);
    }
  }

  async function askFollowup(question: string) {
    if (!result) return;
    const userTurn: ChatTurn = { id: `${Date.now()}-user`, role: "user", text: question };
    const nextTurns = [...turns, userTurn];
    setTurns(nextTurns);
    setChatLoading(true);
    setError("");
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Sign in to ask follow-up questions.");
      const response = await askAboutPrediction({
        question,
        prediction: result,
        conversationContext: conversationContext(turns),
      }, accessToken);
      const assistantTurn: ChatTurn = { id: `${Date.now()}-assistant`, role: "assistant", text: response.answer };
      setTurns([...nextTurns, assistantTurn]);
      if (response.intent === "revise" && response.revisionPrompt) {
        setChatLoading(false);
        setLoading(true);
        setSyncWarning("");
        try {
          const revised = await predictAndSave({ prompt: response.revisionPrompt }, [...nextTurns, assistantTurn]);
          const top = revised.recommendations[0];
          const summary = `Revised estimate: ${fmtKg(revised.predictedKg)} CO₂e.${top ? ` ${top.title} could save about ${fmtKg(top.savingsKg)}.` : ""}`;
          setTurns((current) => [...current, { id: `${Date.now()}-assistant-result`, role: "assistant", text: summary }]);
        } finally {
          setLoading(false);
        }
      }
    } catch (e) {
      setError((e as Error).message);
      setTurns(turns);
    } finally {
      setChatLoading(false);
    }
  }

  const submitInitialPrompt = useEffectEvent((prompt: string) => {
    void submit({ prompt });
  });

  // A prompt sent from the home page runs straight away
  useEffect(() => {
    if (!initialPrompt || autoRan.current) return;
    // Mark it run only when the timer fires: dev mode runs effects twice and cancels the first timer
    const t = setTimeout(() => {
      autoRan.current = true;
      submitInitialPrompt(initialPrompt);
    }, 0);
    return () => clearTimeout(t);
  }, [initialPrompt]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Predict a decision"
        description="Describe what you're planning. We'll predict its footprint, show the lower-carbon options and tell you what's worth changing."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.25fr] [&>*]:min-w-0">
        <Card title="Ask CarbonShift" className="lg:sticky lg:top-6">
          <AIInput onSubmit={submit} loading={loading} initialPrompt={initialPrompt} />
          <div className="mt-5 border-t border-line pt-4">
            <PredictionFollowup enabled={!!result} loading={chatLoading || loading} onAsk={askFollowup} />
          </div>
          {error && <div className="mt-3"><ErrorMessage message={error} /></div>}
          {syncWarning && <p role="status" className="mt-3 text-xs text-clay">{syncWarning}</p>}
        </Card>
        <div className="space-y-4">
          {loading && <GrowingLoader steps={LOADING_STEPS} />}
          {turns.length > 0 && (
            <Card title="Conversation">
              <ol className="space-y-3">
                {turns.map((turn) => (
                  <li key={turn.id} className={turn.role === "user" ? "ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-forest px-4 py-3 text-sm leading-relaxed text-white" : "max-w-[92%] rounded-2xl rounded-bl-sm bg-sage px-4 py-3 text-sm leading-relaxed text-ink"}>
                    {turn.text}
                  </li>
                ))}
              </ol>
            </Card>
          )}
          {!result && !loading && turns.length === 0 && (
            <Card title="CarbonShift assistant" className="min-h-44">
              <div className="max-w-lg rounded-2xl rounded-bl-sm bg-sage px-4 py-3 text-sm leading-relaxed text-ink">
                Tell me about a plan. I’ll estimate its footprint, compare practical alternatives, and keep the calculation grounded in the app’s sourced factors.
              </div>
            </Card>
          )}
          {result && !loading && (
            <>
              <AIResult data={result} />

              {result.recommendations.map((r) => (
                <RecommendationCard key={r.id} rec={r} currency={result.currency} />
              ))}
              {result.recommendations.length === 0 && (
                <p className="text-sm text-ink/60">No practical lower-carbon option found: this is already a good choice.</p>
              )}
              {entry && result.recommendations.length > 0 && (
                <Card>
                  <ChoicePicker entry={entry} />
                </Card>
              )}
              {history && <BudgetMeter history={history} thisKg={entry ? committedKg(entry) : result.predictedKg} />}

              <ImpactCharts data={result} />
              {!!result.tripOptions?.length && (
                <TripOptions label={result.tripLabel} options={result.tripOptions} currency={result.currency} />
              )}
              {result.map && (
                <Card title="Route map">
                  <RouteMap data={result.map} currency={result.currency} label={`Map of travel options${result.tripLabel ? ` for ${result.tripLabel}` : ""}`} />
                  {(() => {
                    const from = result.map.points.find((p) => p.kind === "origin")?.name;
                    const to = result.map.points.find((p) => p.kind === "destination")?.name;
                    return from && to ? (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-medium">Go ahead with it</p>
                        <TravelLinks from={from} to={to} options={result.tripOptions ?? []} region={result.region} />
                      </div>
                    ) : null;
                  })()}
                </Card>
              )}
              {result.breakdown?.length ? (
                <Card title="What we counted">
                  <BreakdownTable lines={result.breakdown} />
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer text-ink/60">How each line was calculated</summary>
                    <p className="mt-2 leading-relaxed text-ink/80">{result.explanation}</p>
                  </details>
                </Card>
              ) : (
                <AIExplanation data={result} />
              )}
              <div className="flex gap-4 text-sm">
                <Link href="/result" className="text-moss underline">View history</Link>
                <Link href="/recommendations" className="underline">Your best recommendations</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
