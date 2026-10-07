"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { DecisionDetail } from "@/components/report/DecisionDetail";
import { HistoryFilters } from "@/components/ui/HistoryFilters";
import { applyFilter, DEFAULT_FILTER, describeFilter, type HistoryFilter } from "@/lib/filters";
import { committedKg, fmtDate, useHistory, type HistoryEntry } from "@/lib/history";
import { bestSaving, SCOPE_LABEL, summarize } from "@/lib/stats";
import { cn, fmtKg } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

const SOURCES = [
  "Central Electricity Authority (India), CO₂ Baseline Database v22, FY 2025-26 (India grid electricity)",
  "Ember electricity data via API, latest year (other countries' grid electricity)",
  "Electricity Maps, last 24 hours (live grid timing advice)",
  "Google Travel Impact Model v3 (flight emissions, as shown on Google Flights; CO₂e from fuel, excluding contrail warming)",
  "OpenRouteService (road distances and driving times); OurAirports (airport locations and flight distances)",
  "UK DESNZ Greenhouse Gas Conversion Factors for Company Reporting 2024 (other transport, fuels, waste, materials; fallback flights include radiative forcing)",
  "Ember / IEA electricity generation carbon intensity by country, 2023 (built-in fallback)",
  "Poore & Nemecek (2018), Science, via Our World in Data (food)",
  "Inventory of Carbon and Energy (ICE) v3 (construction materials)",
  "IPCC AR5 100-year global warming potentials (refrigerants)",
  "Cornell Hotel Sustainability Benchmarking (hotel stays); IEA (video streaming)",
];

const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "0%");

export default function ReportPage() {
  // useSearchParams needs a Suspense boundary in the App Router
  return (
    <Suspense fallback={null}>
      <Report />
    </Suspense>
  );
}

function Report() {
  const history = useHistory();
  const onlyId = useSearchParams().get("id");
  const [filter, setFilter] = useState<HistoryFilter>(DEFAULT_FILTER);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailed, setDetailed] = useState(false);
  // While set, the document shows exactly these decisions and the print dialog opens
  const [printing, setPrinting] = useState<{ ids: string[]; detailed: boolean } | null>(null);

  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(null);
    window.addEventListener("afterprint", done);
    window.print();
    return () => window.removeEventListener("afterprint", done);
  }, [printing]);

  if (!history) return null;
  if (history.length === 0)
    return (
      <p className="text-sm">
        Nothing to report yet. <Link href="/ai" className="text-moss underline">Predict a decision</Link> first.
      </p>
    );

  const single = onlyId ? history.find((e) => e.id === onlyId) : undefined;
  const filtered = applyFilter(history, filter);
  const shown = single ? [single] : filtered;
  const docEntries = printing ? shown.filter((e) => printing.ids.includes(e.id)) : shown;
  const docDetailed = printing ? printing.detailed : detailed || !!single;
  const selectedShown = shown.filter((e) => selected.has(e.id));

  const print = (entries: HistoryEntry[], withDetail: boolean) =>
    setPrinting({ ids: entries.map((e) => e.id), detailed: withDetail || entries.length === 1 });
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plan"
        icon="doc"
        title="Report"
        description="Print all your decisions together, a selection, or one at a time. Save as PDF from the print dialog."
        actions={single && (
          <Link href="/report" className="inline-flex items-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-moss hover:bg-sage/60">
            Show all decisions
          </Link>
        )}
      />

      {onlyId && !single && (
        <p className="text-sm print:hidden">
          That decision is no longer in your history. <Link href="/report" className="text-moss underline">Show all</Link>
        </p>
      )}

      {!single && (
        <div className="space-y-3 print:hidden">
          <HistoryFilters value={filter} onChange={setFilter} shown={filtered.length} total={history.length} />
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => print(filtered, detailed)}
              disabled={filtered.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-white shadow-[0_6px_16px_-8px_rgba(15,42,31,0.6)] transition hover:bg-moss active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Print all shown ({filtered.length})
            </button>
            <button
              onClick={() => print(selectedShown, detailed)}
              disabled={selectedShown.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-fern/50 hover:bg-sage/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Print selected ({selectedShown.length})
            </button>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={detailed} onChange={(e) => setDetailed(e.target.checked)} />
              Include full details for each decision
            </label>
            {selectedShown.length > 0 && (
              <button onClick={() => setSelected(new Set())} className="text-sm text-ink/60 underline">
                Clear selection
              </button>
            )}
          </div>
          <p className="text-xs text-ink/50">
            Tip: tick decisions in the table to print just those, or use &ldquo;Print&rdquo; on a row for a detailed one-page report.
            Choose &ldquo;Save as PDF&rdquo; in the print dialog to get a file.
          </p>
        </div>
      )}

      {single && (
        <div className="flex gap-3 print:hidden">
          <button onClick={() => print([single], true)} className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-white shadow-[0_6px_16px_-8px_rgba(15,42,31,0.6)] transition hover:bg-moss active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45">
            Print / save as PDF
          </button>
        </div>
      )}

      {docEntries.length === 0 ? (
        <p className="text-sm text-ink/60">No decisions match these filters.</p>
      ) : (
        <ReportDocument
          entries={docEntries}
          detailed={docDetailed}
          subtitle={single || printing?.ids.length === 1 ? "Single decision" : describeFilter(filter)}
          selection={printing || single ? undefined : { selected, toggle, printOne: (e) => print([e], true) }}
        />
      )}
    </div>
  );
}

function ReportDocument({
  entries,
  detailed,
  subtitle,
  selection,
}: {
  entries: HistoryEntry[];
  detailed: boolean;
  subtitle: string;
  selection?: { selected: Set<string>; toggle: (id: string) => void; printOne: (e: HistoryEntry) => void };
}) {
  const s = summarize(entries);
  const committed = entries.reduce((sum, e) => sum + committedKg(e), 0);
  const first = s.cumulative[0]?.at;
  const last = s.cumulative[s.cumulative.length - 1]?.at;
  const scopeTotal = s.scopes.reduce((sum, x) => sum + x.kg, 0);
  const single = entries.length === 1;

  return (
    <article className="space-y-8 rounded-3xl border border-line/80 bg-white p-6 text-sm text-ink print:max-w-none print:rounded-none print:p-0 md:p-10">
      <header className="border-b border-line pb-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          CarbonShift · {single ? "Decision report" : "Emissions report"}
        </h2>
        <p className="mt-1 text-ink/60">
          {single
            ? fmtDate(entries[0].createdAt)
            : `${fmtDate(first)} to ${fmtDate(last)} · ${s.count} decisions`}
          {" · "}generated {new Date().toLocaleDateString()}
          {subtitle && !single && <> · {subtitle}</>}
        </p>
      </header>

      {single ? (
        <DecisionDetail entry={entries[0]} />
      ) : (
        <>
          <section>
            <h3 className="mb-3 text-base font-semibold">Summary</h3>
            <table className="w-full max-w-lg">
              <tbody className="tabular-nums">
                {[
                  ["Predicted emissions (as planned)", fmtKg(s.totalKg)],
                  ["Committed emissions (after your choices)", fmtKg(committed)],
                  ["Avoided through choices made", `${fmtKg(s.avoidedKg)} (${s.choices} choice${s.choices === 1 ? "" : "s"})`],
                  ["Further avoidable (best change each)", fmtKg(Math.max(0, s.avoidableKg - s.avoidedKg))],
                ].map(([k, v]) => (
                  <tr key={k} className="border-t border-line">
                    <td className="py-1.5 pr-4">{k}</td>
                    <td className="py-1.5 text-right font-medium">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="grid gap-8 md:grid-cols-2 print:grid-cols-2">
            <div>
              <h3 className="mb-3 text-base font-semibold">By GHG Protocol scope</h3>
              <table className="w-full">
                <tbody className="tabular-nums">
                  {s.scopes.map((x) => (
                    <tr key={x.scope} className="border-t border-line">
                      <td className="py-1.5 pr-3">{SCOPE_LABEL[x.scope]}</td>
                      <td className="py-1.5 pr-3 text-right">{fmtKg(x.kg)}</td>
                      <td className="py-1.5 text-right text-ink/60">{pct(x.kg, scopeTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {s.unscopedKg > 0 && <p className="mt-2 text-xs text-ink/60">{fmtKg(s.unscopedKg)} from older entries has no scope split.</p>}
            </div>
            <div>
              <h3 className="mb-3 text-base font-semibold">By category</h3>
              <table className="w-full">
                <tbody className="tabular-nums">
                  {s.byCategory.map((c) => (
                    <tr key={c.category} className="border-t border-line">
                      <td className="py-1.5 pr-3 capitalize">{c.category}</td>
                      <td className="py-1.5 pr-3 text-right">{fmtKg(c.kg)}</td>
                      <td className="py-1.5 text-right text-ink/60">{pct(c.kg, s.totalKg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-base font-semibold">Decisions</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="text-xs text-ink/60">
                  <tr>
                    {selection && (
                      <th className="py-1 pr-2 text-left font-medium print:hidden">
                        <span className="sr-only">Select</span>
                      </th>
                    )}
                    <th className="py-1 pr-3 text-left font-medium">Date</th>
                    <th className="py-1 pr-3 text-left font-medium">Activity</th>
                    <th className="py-1 pr-3 text-right font-medium whitespace-nowrap">Predicted</th>
                    <th className="py-1 pr-3 text-left font-medium">Choice</th>
                    <th className="py-1 text-right font-medium whitespace-nowrap">Best saving</th>
                    {selection && <th className="print:hidden" />}
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {entries.map((e) => (
                    <tr
                      key={e.id}
                      className={cn("border-t border-line align-top", selection?.selected.has(e.id) && "bg-lime/20 print:bg-transparent")}
                    >
                      {selection && (
                        <td className="py-1.5 pr-2 print:hidden">
                          <input
                            type="checkbox"
                            checked={selection.selected.has(e.id)}
                            onChange={() => selection.toggle(e.id)}
                            aria-label={`Select ${e.request.prompt}`}
                          />
                        </td>
                      )}
                      <td className="py-1.5 pr-3 whitespace-nowrap">{fmtDate(e.createdAt)}</td>
                      <td className="py-1.5 pr-3">{e.request.prompt}</td>
                      <td className="py-1.5 pr-3 text-right whitespace-nowrap">{fmtKg(e.prediction.predictedKg)}</td>
                      <td className="py-1.5 pr-3">{e.choice ? `${e.choice.title} (${fmtKg(e.choice.kg)})` : "—"}</td>
                      <td className="py-1.5 text-right whitespace-nowrap">{fmtKg(bestSaving(e))}</td>
                      {selection && (
                        <td className="py-1.5 pl-3 text-right print:hidden">
                          <button onClick={() => selection.printOne(e)} className="text-moss underline">
                            Print
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {detailed &&
            entries.map((e) => (
              <div key={e.id} className="border-t border-line pt-6 print:break-before-page print:border-0 print:pt-0">
                <DecisionDetail entry={e} />
              </div>
            ))}
        </>
      )}

      <section className="break-inside-avoid">
        <h3 className="mb-2 text-base font-semibold">Method and sources</h3>
        <p className="leading-relaxed text-ink/80">
          Each description is converted by an AI model into activities and quantities only; all emissions are calculated
          deterministically from published emission factors. Where details were missing, typical values were assumed and
          shown with each prediction. Figures are estimates for decision support, not audited inventory data. Scopes assume
          vehicles and buildings are the reporting entity&apos;s own. Costs are rough AI estimates.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-ink/70">
          {SOURCES.map((src) => (
            <li key={src}>{src}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
