import { BreakdownTable } from "@/components/ai/BreakdownTable";
import { fmtDate, isPlanned, type HistoryEntry } from "@/lib/history";
import { SCOPE_LABEL } from "@/lib/stats";
import { fmtKg, fmtMoney, fmtPct } from "@/lib/utils";

const fmtHours = (h: number | null | undefined) => {
  if (!h) return "—";
  const mins = Math.round(h * 60);
  return mins >= 60 ? `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, "0")} min` : `${mins} min`;
};

/** Everything known about one decision, laid out for print. */
export function DecisionDetail({ entry }: { entry: HistoryEntry }) {
  const p = entry.prediction;
  const cost = fmtMoney(p.costEstimate, p.currency);
  const scopes = p.scopes;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs text-ink/60">
          {fmtDate(entry.createdAt)} · {entry.kind === "calculation" ? "Calculation" : "Prediction"}
        </p>
        <h3 className="text-lg font-semibold">{entry.request.prompt}</h3>
        {entry.request.distanceKm && <p className="text-xs text-ink/60">Distance entered: {entry.request.distanceKm} km</p>}
      </div>

      <table className="w-full max-w-lg">
        <tbody className="tabular-nums">
          {[
            ["Predicted emissions", `${fmtKg(p.predictedKg)} CO₂e`],
            ["Category", p.category[0].toUpperCase() + p.category.slice(1)],
            ["Confidence", entry.kind === "calculation" ? "Exact calculation" : fmtPct(p.confidence)],
            ...(cost ? [["Estimated cost", cost]] : []),
            ...(scopes
              ? ([1, 2, 3] as const)
                  .filter((s) => scopes[`scope${s}`] > 0)
                  .map((s) => [SCOPE_LABEL[s], fmtKg(scopes[`scope${s}`])])
              : []),
            ["Your choice", entry.choice ? `${entry.choice.title} (${fmtKg(entry.choice.kg)}) · ${isPlanned(entry.choice) ? "planned" : "done"}` : "Not chosen yet"],
          ].map(([k, v]) => (
            <tr key={k} className="border-t border-line">
              <td className="py-1.5 pr-4 text-ink/70">{k}</td>
              <td className="py-1.5 text-right font-medium">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {!!p.breakdown?.length && (
        <div className="break-inside-avoid">
          <h4 className="mb-1 font-semibold">What was counted</h4>
          <BreakdownTable lines={p.breakdown} />
        </div>
      )}

      {!!p.tripOptions?.length && (
        <div className="break-inside-avoid">
          <h4 className="mb-1 font-semibold">Ways to travel{p.tripLabel ? ` · ${p.tripLabel}` : ""}</h4>
          <table className="w-full">
            <tbody className="tabular-nums">
              {p.tripOptions.map((o, i) => (
                <tr key={`${i}-${o.title}`} className="border-t border-line">
                  <td className="py-1.5 pr-3">
                    {o.title}
                    {o.recommended && " · most viable"}
                    {o.isPlan && " · your plan"}
                  </td>
                  <td className="py-1.5 pr-3 text-right">{fmtKg(o.kg)}</td>
                  <td className="py-1.5 pr-3 text-right">{fmtHours(o.hours)}</td>
                  <td className="py-1.5 text-right">{fmtMoney(o.cost, p.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="break-inside-avoid">
        <h4 className="mb-1 font-semibold">Recommendations</h4>
        {p.recommendations.length === 0 ? (
          <p className="text-ink/70">
            {entry.kind === "calculation" ? "Exact calculation; no alternatives were requested." : "No practical lower-carbon option: already a good choice."}
          </p>
        ) : (
          <ul className="space-y-2">
            {p.recommendations.map((r) => (
              <li key={r.id} className="border-t border-line pt-2">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">{r.title}</span>
                  <span className="tabular-nums">−{fmtKg(r.savingsKg)}</span>
                </div>
                <p className="text-ink/70">{r.description}</p>
                <p className="text-xs text-ink/60">
                  {r.effort} effort{fmtMoney(r.cost, p.currency) && ` · ${fmtMoney(r.cost, p.currency)}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="break-inside-avoid">
        <h4 className="mb-1 font-semibold">How it was calculated</h4>
        <p className="leading-relaxed text-ink/80">{p.explanation}</p>
        {!!p.missingInfo?.length && (
          <p className="mt-2 text-ink/70">
            <span className="font-medium">Would be more accurate with:</span> {p.missingInfo.join("; ")}.
          </p>
        )}
      </div>
    </section>
  );
}
