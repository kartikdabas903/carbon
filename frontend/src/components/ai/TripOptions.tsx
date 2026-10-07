import { Card } from "@/components/ui/Card";
import { fmtKg, fmtMoney } from "@/lib/utils";
import type { TripOption } from "@/types/ai";

const fmtHours = (h: number | null) => {
  if (!h) return "—";
  const mins = Math.round(h * 60);
  return mins >= 60 ? `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, "0")} min` : `${mins} min`;
};

export function TripOptions({
  label,
  options,
  currency,
}: {
  label?: string | null;
  options: TripOption[];
  currency?: string | null;
}) {
  const max = Math.max(...options.map((o) => o.kg), 0.01);
  return (
    <Card title={label ? `Ways to travel · ${label}` : "Ways to travel"}>
      <ul className="space-y-3">
        {options.map((o, i) => (
          <li key={`${i}-${o.title}`} className="text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="font-medium">
                {o.title}
                {o.recommended && (
                  <span className="ml-2 rounded-full bg-sprout px-2 py-0.5 text-xs font-medium text-forest">Most viable</span>
                )}
                {o.isPlan && (
                  <span className="ml-2 rounded-full bg-clay/15 px-2 py-0.5 text-xs font-medium text-[#8a3a12]">Your plan</span>
                )}
              </span>
              <span className="text-ink/70">
                {fmtKg(o.kg)} CO₂e · {fmtHours(o.hours)}
                {fmtMoney(o.cost, currency) && <> · {fmtMoney(o.cost, currency)}</>}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded bg-line">
              <div
                className={o.recommended ? "h-full rounded bg-moss" : "h-full rounded bg-ink/30"}
                style={{ width: `${(o.kg / max) * 100}%` }}
              />
            </div>
            {o.note && <p className="mt-1 text-xs text-ink/50">{o.note}</p>}
            {o.source && <p className="text-[11px] text-ink/40">{o.source}</p>}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-ink/50">
        Times are door-to-door estimates, including getting to the station or airport and waiting. &ldquo;Most viable&rdquo; is the lowest-carbon option that takes at most 1.5× as long as the fastest, plus 1 hour.
        {options.some((o) => o.source?.includes("Google Travel Impact")) && (
          <>
            {" "}Flight figures come from Google&apos;s Travel Impact Model (as shown on Google Flights) and count CO₂e from fuel;
            including contrail warming, as UK government factors do, would make them roughly 1.7× higher.
          </>
        )}
      </p>
    </Card>
  );
}
