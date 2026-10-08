"use client";
import { ChoicePicker } from "@/components/ai/ChoicePicker";
import { useSaveChoice } from "@/components/ai/useSaveChoice";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { choiceFor, choiceSavingKg, chosenIds, fmtDate, isPlanned, type HistoryEntry } from "@/lib/history";
import { bestSaving } from "@/lib/stats";
import { fmtKg } from "@/lib/utils";

const MAX_ROWS = 5;

/** One planned change: confirm it happened, or say it didn't. */
function PlannedRow({ entry }: { entry: HistoryEntry }) {
  const { save, saving, error } = useSaveChoice(entry.id);
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sage text-moss"><Icon name="leaf" className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink [overflow-wrap:anywhere]">{entry.choice!.title}</span>
        <span className="block truncate text-xs text-ink/50">For: {entry.request.prompt} · {fmtDate(entry.createdAt)}</span>
      </span>
      <span className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
        <span className="mr-auto text-xs font-semibold tabular-nums text-moss sm:mr-0">−{fmtKg(choiceSavingKg(entry))}</span>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save(choiceFor(entry, [], "done"))}
          className="rounded-full border border-line bg-surface-strong px-3 py-1.5 text-xs font-medium text-ink/65 transition hover:text-clay disabled:opacity-60"
        >
          Didn&apos;t happen
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save(choiceFor(entry, chosenIds(entry), "done"))}
          className="rounded-full bg-forest px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-moss disabled:opacity-60"
        >
          ✓ Done
        </button>
      </span>
      {error && <p role="alert" className="w-full text-xs text-clay">{error}</p>}
    </li>
  );
}

/**
 * The follow-through loop: changes you planned but haven't confirmed, and recent
 * decisions with a greener option you haven't answered yet.
 */
export function FollowUps({ history }: { history: HistoryEntry[] }) {
  const planned = history.filter((e) => isPlanned(e.choice));
  const open = history
    .filter((e) => !e.choice && e.kind !== "calculation" && bestSaving(e) > 0)
    .slice(0, MAX_ROWS);
  if (planned.length === 0 && open.length === 0) return null;
  const pendingKg = planned.reduce((s, e) => s + choiceSavingKg(e), 0);

  return (
    <Card className="border-fern/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-forest">Did you go greener?</h2>
          <p className="mt-0.5 text-sm text-ink/60">
            Confirm the changes you made. Only confirmed changes count as <strong className="font-semibold text-ink/80">actually avoided</strong>.
          </p>
        </div>
        {planned.length > 0 && (
          <span className="rounded-full bg-sprout/70 px-3 py-1 text-xs font-semibold text-forest">
            {fmtKg(pendingKg)} waiting to be confirmed
          </span>
        )}
      </div>

      {planned.length > 0 && (
        <section className="mt-4">
          <h3 className="text-sm font-semibold text-ink/70">Planned · {planned.length}</h3>
          <ul className="divide-y divide-line">
            {planned.slice(0, MAX_ROWS).map((e) => <PlannedRow key={e.id} entry={e} />)}
          </ul>
          {planned.length > MAX_ROWS && <p className="text-xs text-ink/50">+{planned.length - MAX_ROWS} more on the History page.</p>}
        </section>
      )}

      {open.length > 0 && (
        <section className="mt-4">
          <h3 className="text-sm font-semibold text-ink/70">Not answered yet · {open.length}</h3>
          <ul className="mt-1 divide-y divide-line">
            {open.map((e) => (
              <li key={e.id}>
                <details className="group py-3">
                  <summary className="flex cursor-pointer list-none items-center gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink [overflow-wrap:anywhere]">{e.request.prompt}</span>
                      <span className="block text-xs text-ink/50">
                        {fmtKg(e.prediction.predictedKg)} as planned · up to {fmtKg(bestSaving(e))} avoidable
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-moss group-open:bg-sage">
                      <span className="group-open:hidden">Record what you did</span>
                      <span className="hidden group-open:inline">Close</span>
                    </span>
                  </summary>
                  <div className="mt-3 rounded-2xl bg-mist/40 p-3 sm:p-4">
                    <ChoicePicker entry={e} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Card>
  );
}
