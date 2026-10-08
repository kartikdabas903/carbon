"use client";
import { useSaveChoice } from "@/components/ai/useSaveChoice";
import { Icon } from "@/components/ui/Icon";
import { choiceFor, choiceSavingKg, chosenIds, isDone, isExclusive, PLAN_TITLE, type HistoryEntry } from "@/lib/history";
import { cn, fmtKg } from "@/lib/utils";

const fmtDay = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "");

/**
 * "What did you do?" Pick the change(s), then mark them done once made.
 * Only done changes count as avoided CO₂; planned ones show as pending.
 */
export function ChoicePicker({ entry }: { entry: HistoryEntry }) {
  const { save, saving, error } = useSaveChoice(entry.id);
  const p = entry.prediction;
  if (p.recommendations.length === 0) return null;

  const exclusive = isExclusive(entry);
  const ids = chosenIds(entry);
  const keptPlan = entry.choice?.title === PLAN_TITLE;
  const done = isDone(entry.choice);
  const savedKg = choiceSavingKg(entry);
  // New picks start as planned; changing picks keeps an existing done status
  const status = ids.length ? (entry.choice?.status ?? "done") : "planned";

  const pick = (id: string) => {
    const next = exclusive ? (ids.includes(id) ? [] : [id]) : ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    void save(next.length === 0 ? undefined : choiceFor(entry, next, status));
  };

  const options = p.recommendations.map((r) => {
    const after = Math.max(0, p.predictedKg - r.savingsKg);
    return { id: r.id, title: r.title, after, saving: Math.min(p.predictedKg, r.savingsKg), effort: r.effort };
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{exclusive ? "Which option are you going with?" : "Which changes are you making?"}</p>
        <p className="text-xs text-ink/50">{exclusive ? "Pick one" : "Tick all that apply"}</p>
      </div>

      <div className="grid gap-2" role={exclusive ? "radiogroup" : "group"} aria-label="Lower-carbon options">
        {options.map((o) => {
          const active = ids.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              role={exclusive ? "radio" : "checkbox"}
              aria-checked={active}
              disabled={saving}
              onClick={() => pick(o.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition disabled:opacity-60",
                active ? "border-fern bg-fern/10" : "border-line bg-surface-strong hover:border-fern/50"
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center border-2 transition",
                  exclusive ? "rounded-full" : "rounded-md",
                  active ? "border-fern bg-fern text-white" : "border-ink/25"
                )}
                aria-hidden
              >
                {active && <Icon name="check" className="h-3 w-3" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-ink [overflow-wrap:anywhere]">{o.title}</span>
                <span className="block text-xs text-ink/50">{o.effort} effort · {fmtKg(o.after)} instead of {fmtKg(p.predictedKg)}</span>
              </span>
              <span className="shrink-0 rounded-full bg-sprout px-2.5 py-0.5 text-xs font-semibold tabular-nums text-forest">−{fmtKg(o.saving)}</span>
            </button>
          );
        })}
        <button
          type="button"
          disabled={saving}
          onClick={() => void save(keptPlan ? undefined : choiceFor(entry, [], "done"))}
          aria-pressed={keptPlan}
          className={cn(
            "rounded-xl border border-dashed px-3 py-2 text-left text-xs transition disabled:opacity-60",
            keptPlan ? "border-clay/50 bg-clay/5 text-clay" : "border-line text-ink/55 hover:text-ink"
          )}
        >
          {keptPlan ? `✓ Kept the original plan (${fmtKg(p.predictedKg)})` : "None of these: I kept my original plan"}
        </button>
      </div>

      {ids.length > 0 && (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 rounded-xl px-3 py-2.5",
            done ? "bg-[linear-gradient(120deg,#e3f4d3,#f3faea)]" : "bg-sage/60"
          )}
        >
          <p className="min-w-0 text-sm">
            {done ? (
              <>
                <span className="font-semibold text-moss">✓ Done{entry.choice?.doneAt ? ` · ${fmtDay(entry.choice.doneAt)}` : ""}.</span>{" "}
                You avoided <strong className="text-forest">{fmtKg(savedKg)}</strong> CO₂e
                {p.predictedKg > 0 && <> ({Math.round((savedKg / p.predictedKg) * 100)}%)</>}.
              </>
            ) : (
              <>
                <span className="font-semibold text-ink">Planned.</span> Mark it done once you&apos;ve made the switch to count{" "}
                <strong className="text-forest">{fmtKg(savedKg)}</strong> as avoided.
              </>
            )}
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save(choiceFor(entry, ids, done ? "planned" : "done"))}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition disabled:opacity-60",
              done ? "border border-line bg-surface-strong text-ink/70 hover:text-ink" : "bg-forest text-white hover:bg-moss"
            )}
          >
            {done ? "Undo: not done yet" : "✓ I did it"}
          </button>
        </div>
      )}

      {saving && <p role="status" className="text-xs text-ink/50">Saving…</p>}
      {error && <p role="alert" className="text-xs text-clay">{error}</p>}
    </div>
  );
}
