import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { Summary } from "@/lib/stats";
import { fmtKg } from "@/lib/utils";

const count = (n: number) => String(Math.round(n));

export function StatTiles({ summary: s }: { summary: Summary }) {
  const pct = s.totalKg > 0 ? Math.round((s.avoidableKg / s.totalKg) * 100) : 0;
  const tiles: { label: string; value: number; format: (n: number) => string; note: string; icon: IconName; accent?: boolean }[] = [
    { label: "Predicted emissions", value: s.totalKg, format: fmtKg, note: "across all decisions", icon: "chart" },
    { label: "Avoidable", value: s.avoidableKg, format: fmtKg, note: `${pct}% · taking the best change each time`, icon: "leaf" },
    {
      label: "Actually avoided",
      value: s.avoidedKg,
      format: fmtKg,
      note: s.choices ? `from ${s.choices} choice${s.choices === 1 ? "" : "s"} you made` : "mark what you chose to track this",
      icon: "shield",
      accent: true,
    },
    { label: "Decisions analysed", value: s.count, format: count, note: "predictions and calculations", icon: "sparkle" },
  ];
  return (
    <div className="stagger grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      {tiles.map((t) => (
        <Card key={t.label} compact className={t.accent ? "border-fern/30 bg-[linear-gradient(160deg,#f1f8e6,#fffdf7)]" : undefined}>
          <p className="flex items-center gap-2 text-xs text-ink/60 md:text-sm">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-sage text-moss">
              <Icon name={t.icon} className="h-4 w-4" />
            </span>
            {t.label}
          </p>
          <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-forest md:text-3xl">
            <CountUp value={t.value} format={t.format} />
          </p>
          <p className="mt-1 text-xs text-ink/50">{t.note}</p>
        </Card>
      ))}
    </div>
  );
}
