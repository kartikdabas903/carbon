"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_FILTER,
  isFiltered,
  PERIOD_LABELS,
  SIZE_LABELS,
  SORT_LABELS,
  type HistoryFilter,
  type SortKey,
} from "@/lib/filters";

const CATEGORIES = ["transport", "building", "electricity", "equipment", "resources"] as const;
const SCOPES = { "1": "Scope 1 · fuel", "2": "Scope 2 · electricity", "3": "Scope 3 · value chain" } as const;

const selectClass = "field py-1.5 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0 text-xs text-ink/60">
      {label}
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

/** Search, filter and sort controls for saved predictions and calculations. */
export function HistoryFilters({
  value,
  onChange,
  shown,
  total,
}: {
  value: HistoryFilter;
  onChange: (f: HistoryFilter) => void;
  shown: number;
  total: number;
}) {
  const set = <K extends keyof HistoryFilter>(key: K, v: HistoryFilter[K]) => onChange({ ...value, [key]: v });
  // On phones only search and sort show until "More filters" is opened
  const [more, setMore] = useState(false);
  const extraActive = (["category", "scope", "period", "size", "kind", "choice"] as const).filter(
    (k) => value[k] !== DEFAULT_FILTER[k]
  ).length;

  return (
    <div className="rounded-3xl border border-line/80 bg-surface p-4 print:hidden">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Search">
          <input aria-label="Search"
            type="search"
            value={value.q}
            onChange={(e) => set("q", e.target.value)}
            placeholder="e.g. Delhi, cement, burger"
            className={selectClass}
          />
        </Field>
        <Field label="Sort by">
          <select aria-label="Sort by" value={value.sort} onChange={(e) => set("sort", e.target.value as SortKey)} className={selectClass}>
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k}>{SORT_LABELS[k]}</option>
            ))}
          </select>
        </Field>
        <div className={cn("contents", !more && "max-sm:hidden")}>
          <Field label="Category">
            <select aria-label="Category" value={value.category} onChange={(e) => set("category", e.target.value as HistoryFilter["category"])} className={selectClass}>
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">{c[0].toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </Field>
          <Field label="GHG scope">
            <select aria-label="GHG scope" value={value.scope} onChange={(e) => set("scope", e.target.value as HistoryFilter["scope"])} className={selectClass}>
              <option value="all">All scopes</option>
              {(Object.keys(SCOPES) as (keyof typeof SCOPES)[]).map((s) => (
                <option key={s} value={s}>{SCOPES[s]}</option>
              ))}
            </select>
          </Field>
          <Field label="When">
            <select aria-label="When" value={value.period} onChange={(e) => set("period", e.target.value as HistoryFilter["period"])} className={selectClass}>
              <option value="all">Any time</option>
              {(Object.keys(PERIOD_LABELS) as (keyof typeof PERIOD_LABELS)[]).map((p) => (
                <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
              ))}
            </select>
          </Field>
          <Field label="Size">
            <select aria-label="Size" value={value.size} onChange={(e) => set("size", e.target.value as HistoryFilter["size"])} className={selectClass}>
              <option value="all">Any size</option>
              {(Object.keys(SIZE_LABELS) as (keyof typeof SIZE_LABELS)[]).map((s) => (
                <option key={s} value={s}>{SIZE_LABELS[s]}</option>
              ))}
            </select>
          </Field>
          <Field label="Type">
            <select aria-label="Type" value={value.kind} onChange={(e) => set("kind", e.target.value as HistoryFilter["kind"])} className={selectClass}>
              <option value="all">Predictions and calculations</option>
              <option value="prediction">Predictions only</option>
              <option value="calculation">Calculations only</option>
            </select>
          </Field>
          <Field label="Your choice">
            <select aria-label="Your choice" value={value.choice} onChange={(e) => set("choice", e.target.value as HistoryFilter["choice"])} className={selectClass}>
              <option value="all">Any</option>
              <option value="chosen">Choice made</option>
              <option value="open">Still to choose</option>
            </select>
          </Field>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink/60">
        <span aria-live="polite">
          Showing {shown} of {total}
        </span>
        <button
          onClick={() => setMore(!more)}
          aria-expanded={more}
          className="rounded-full border border-line bg-surface px-3 py-1 font-medium text-moss sm:hidden"
        >
          {more ? "Fewer filters" : `More filters${extraActive ? ` (${extraActive} on)` : ""}`}
        </button>
        {(isFiltered(value) || value.sort !== DEFAULT_FILTER.sort) && (
          <button onClick={() => onChange(DEFAULT_FILTER)} className="text-moss underline">
            Reset filters
          </button>
        )}
      </div>
    </div>
  );
}
