import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { BreakdownTable } from "@/components/ai/BreakdownTable";
import { ChoicePicker } from "@/components/ai/ChoicePicker";
import { fmtDate, type HistoryEntry } from "@/lib/history";
import { fmtKg, fmtMoney, fmtPct } from "@/lib/utils";

export function HistoryItem({ entry, onDelete }: { entry: HistoryEntry; onDelete: () => void }) {
  const { prediction: p, request } = entry;
  const chosen = p.tripOptions?.find((o) => o.recommended);
  const cost = fmtMoney(p.costEstimate, p.currency);
  return (
    <Card>
      <div className="grid gap-5 md:grid-cols-[1fr_1.3fr]">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs text-ink/50">{fmtDate(entry.createdAt)}</p>
            <span className="flex gap-3 text-xs">
              <Link href={`/report?id=${encodeURIComponent(entry.id)}`} className="text-moss underline">
                Print
              </Link>
              <button onClick={onDelete} className="text-ink/50 hover:text-clay" aria-label="Delete this prediction">
                Delete
              </button>
            </span>
          </div>
          <p className="mt-1 font-medium break-words">{request.prompt}</p>
          {request.distanceKm && <p className="text-xs text-ink/50">Distance entered: {request.distanceKm} km</p>}
          <p className="mt-3 font-display font-semibold tracking-tight text-forest text-3xl">{fmtKg(p.predictedKg)} <span className="text-base font-normal">CO₂e</span></p>
          <p className="text-sm text-ink/60">
            <span className="capitalize">{p.category}</span> · {entry.kind === "calculation" ? "exact calculation" : `${fmtPct(p.confidence)} confidence`}
            {cost && <> · {cost}</>}
          </p>
          {chosen && p.tripLabel && (
            <p className="mt-2 text-sm">
              {p.tripLabel}: <span className="text-moss">{chosen.title}</span> is the most viable option
            </p>
          )}
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-ink/60">How it was calculated</summary>
            <p className="mt-2 leading-relaxed text-ink/80">{p.explanation}</p>
            {!!p.breakdown?.length && (
              <div className="mt-3">
                <BreakdownTable lines={p.breakdown} />
              </div>
            )}
          </details>
        </div>

        <div className="min-w-0 md:border-l md:border-line md:pl-5">
          <h3 className="mb-2 text-sm font-semibold text-ink/70">Recommendations</h3>
          {entry.kind === "calculation" ? (
            <p className="text-sm text-ink/60">
              Exact calculation. Describe the decision on the Predict page to get lower-carbon alternatives.
            </p>
          ) : p.recommendations.length === 0 ? (
            <p className="text-sm text-ink/60">Already a good choice: no practical lower-carbon option.</p>
          ) : (
            <ul className="space-y-3">
              {p.recommendations.map((r) => (
                <li key={r.id} className="text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium">{r.title}</span>
                    <span className="shrink-0 rounded-full bg-sprout px-2.5 py-0.5 text-sm font-semibold text-forest">−{fmtKg(r.savingsKg)}</span>
                  </div>
                  <p className="text-ink/70">{r.description}</p>
                  <p className="text-xs text-ink/50">
                    {r.effort} effort{fmtMoney(r.cost, p.currency) && <> · {fmtMoney(r.cost, p.currency)}</>}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {entry.kind !== "calculation" && p.recommendations.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <ChoicePicker entry={entry} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
