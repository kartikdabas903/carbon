"use client";
import Link from "next/link";
import { HistoryItem } from "@/components/ai/HistoryItem";
import { Card } from "@/components/ui/Card";
import { HistoryFilters } from "@/components/ui/HistoryFilters";
import { applyFilter, DEFAULT_FILTER, type HistoryFilter } from "@/lib/filters";
import { clearHistory, removeHistory, useHistory } from "@/lib/history";
import { clearAccountHistory, deleteAccountHistoryEntry } from "@/lib/account";
import { fmtKg } from "@/lib/utils";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { CountUp } from "@/components/ui/CountUp";

export default function ResultPage() {
  const history = useHistory();
  const [filter, setFilter] = useState<HistoryFilter>(DEFAULT_FILTER);
  const [error, setError] = useState("");

  if (!history) return null;

  const shown = applyFilter(history, filter);
  const totalKg = shown.reduce((sum, e) => sum + e.prediction.predictedKg, 0);
  // Best single change per prediction, so savings aren't double counted
  const potentialKg = shown.reduce(
    (sum, e) => sum + Math.max(0, ...e.prediction.recommendations.map((r) => r.savingsKg)),
    0
  );

  async function clearAll() {
    if (!confirm("Delete all saved predictions?")) return;
    try {
      await clearAccountHistory();
      clearHistory();
      setError("");
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  async function deleteOne(id: string) {
    try {
      await deleteAccountHistoryEntry(id);
      removeHistory(id);
      setError("");
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Track"
        icon="history"
        title="History"
        description="Every prediction and calculation you've made, with its recommendations alongside."
        actions={history.length > 0 && (
          <button onClick={clearAll} className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-fern/50 hover:bg-sage/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 hover:text-clay">
            Clear history
          </button>
        )}
      />

      {error && <p role="alert" className="text-sm text-clay">{error}</p>}

      <section className="space-y-4">
        {history.length === 0 ? (
          <p className="text-sm">
            No predictions yet. <Link href="/ai" className="text-moss underline">Predict an activity</Link> and it will show up here with its recommendations.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <Card compact>
                <p className="text-xs text-ink/60 md:text-sm">Entries shown</p>
                <p className="font-display font-semibold tracking-tight text-forest text-xl md:text-3xl">{shown.length}</p>
              </Card>
              <Card compact>
                <p className="text-xs text-ink/60 md:text-sm">Total predicted</p>
                <p className="font-display font-semibold tracking-tight text-forest text-xl md:text-3xl"><CountUp value={totalKg} format={fmtKg} /></p>
              </Card>
              <Card compact>
                <p className="text-xs text-ink/60 md:text-sm">Could save (best change each)</p>
                <p className="font-display font-semibold tracking-tight text-forest text-xl md:text-3xl"><CountUp value={potentialKg} format={fmtKg} /></p>
              </Card>
            </div>
            <HistoryFilters value={filter} onChange={setFilter} shown={shown.length} total={history.length} />
            {shown.length === 0 && <p className="text-sm text-ink/60">No entries match these filters.</p>}
            {shown.map((e) => (
              <HistoryItem key={e.id} entry={e} onDelete={() => void deleteOne(e.id)} />
            ))}
          </>
        )}
      </section>

      <div className="flex gap-4 text-sm">
        <Link href="/ai" className="text-moss underline">New prediction</Link>
        <Link href="/recommendations" className="underline">Your best recommendations</Link>
      </div>
    </div>
  );
}
