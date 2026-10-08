"use client";
import Link from "next/link";
import { GhostChart } from "@/components/charts/GhostChart";
import { ChoicePicker } from "@/components/ai/ChoicePicker";
import { Card } from "@/components/ui/Card";
import { ghostTimeline, ONE_OFF_KG } from "@/lib/ghost";
import { fmtDate, useHistory } from "@/lib/history";
import { fmtKg } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { CountUp } from "@/components/ui/CountUp";

export default function GhostPage() {
  const history = useHistory();
  if (!history) return null;

  if (history.length === 0)
    return (
      <div className="space-y-6">
        <PageHeader title="Ghost You" description="Ghost You lives the same life but takes the best recommendation every time. Every choice you make closes the gap." />
        <Card>
          <p className="text-sm">
            Ghost You is the version of you who takes every best recommendation.{" "}
            <Link href="/ai" className="text-moss underline">Predict a few decisions</Link> and watch your two futures split.
          </p>
        </Card>
      </div>
    );

  const g = ghostTimeline(history);
  const trees = g.gap2030Kg / 21; // a mature tree absorbs ~21 kg CO₂ a year

  return (
    <div className="space-y-6">
      <PageHeader title="Ghost You" description="Ghost You lives the same life but takes the best recommendation every time. Every choice you make closes the gap." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-ink/60">Ghost You is ahead by</p>
          <p className="mt-1 font-display font-semibold tracking-tight text-forest text-3xl"><CountUp value={g.gapNowKg} format={fmtKg} /></p>
          <p className="text-xs text-ink/50">so far, across {history.length} decisions</p>
        </Card>
        <Card>
          <p className="text-sm text-ink/60">By the end of 2030</p>
          <p className="mt-1 font-display font-semibold tracking-tight text-forest text-3xl"><CountUp value={g.gap2030Kg} format={fmtKg} /></p>
          <p className="text-xs text-ink/50">
            gap if your habits continue · ≈ {Math.round(trees).toLocaleString()} trees growing for a year
          </p>
        </Card>
        <Card>
          <p className="text-sm text-ink/60">Gap you&apos;ve closed</p>
          <p className="mt-1 font-display font-semibold tracking-tight text-forest text-3xl">
            {g.closedPct == null ? "—" : g.closedPct > 0 && g.closedPct < 1 ? "<1%" : `${Math.round(g.closedPct)}%`}
          </p>
          <p className="text-xs text-ink/50">of the savings available, by the choices you made</p>
        </Card>
      </div>

      <Card title="Your two futures">
        <GhostChart points={g.points} now={g.now} end={g.end} />
        <p className="mt-3 text-xs text-ink/50">
          The projection assumes your everyday decisions keep happening at the same rate (measured over at least 30 days).
          {g.oneOffs > 0 &&
            ` ${g.oneOffs} one-off decision${g.oneOffs === 1 ? "" : "s"} over ${fmtKg(ONE_OFF_KG)} (like construction) ${g.oneOffs === 1 ? "is" : "are"} counted once, not projected.`}
        </p>
      </Card>

      <Card title="Where Ghost You chose differently">
        {g.divergences.length === 0 ? (
          <p className="text-sm text-moss">You&apos;ve matched Ghost You on every decision so far.</p>
        ) : (
          <ul className="space-y-4">
            {g.divergences.slice(0, 6).map((d) => (
              <li key={d.entry.id} className="border-t border-line pt-3 text-sm first:border-0 first:pt-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>
                    <span className="font-medium">{d.entry.request.prompt}</span>
                    <span className="ml-2 text-xs text-ink/50">{fmtDate(d.entry.createdAt)}</span>
                  </span>
                  <span className="tabular-nums text-ink/70">Ghost saved {fmtKg(d.gapKg)}</span>
                </div>
                <p className="text-ink/70">Ghost You chose: {d.ghostTook}</p>
                <div className="mt-2">
                  <ChoicePicker entry={d.entry} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
