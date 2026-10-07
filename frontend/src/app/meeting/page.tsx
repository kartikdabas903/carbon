"use client";
import Link from "next/link";
import { useState } from "react";
import { BarChart } from "@/components/charts/BarChart";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RouteMap } from "@/components/map/RouteMap";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { planMeeting } from "@/lib/ai";
import { cacheHistoryEntry, createHistoryEntry } from "@/lib/history";
import { getAccessToken, syncAccountHistory } from "@/lib/account";
import { cn, fmtKg } from "@/lib/utils";
import type { AIPrediction } from "@/types/ai";
import type { Attendee, MeetingCandidate, MeetingRequest, MeetingResult } from "@/types/meeting";
import { PageHeader } from "@/components/ui/PageHeader";

const BEST = "var(--chart-reduced)";
const PLANNED = "var(--chart-planned)";
const OTHER = "#b9c2b6";

const fmtHours = (h: number | null) => {
  if (!h) return "—";
  const mins = Math.round(h * 60);
  return mins >= 60 ? `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, "0")} min` : `${mins} min`;
};

const legsTotal = (attendees: Attendee[]) => attendees.reduce((s, a) => s + a.count, 0);

/** Saves the meeting as a decision: the planned (or worst) venue is the plan, the best venue the recommendation. */
function toPrediction(req: MeetingRequest, res: MeetingResult): AIPrediction {
  const best = res.candidates[0];
  const plan = res.candidates.find((c) => c.isPlanned) ?? best;
  const saving = plan.totalKg - best.totalKg;
  return {
    predictedKg: plan.totalKg,
    confidence: 0.75,
    category: "transport",
    explanation:
      `Compared ${res.candidates.length} venues for ${legsTotal(req.attendees)} people over ${req.nights} night(s): ` +
      res.candidates.map((c) => `${c.city} ${fmtKg(c.totalKg)}`).join(", ") +
      `. Assumptions: ${res.assumptions.join("; ")}.`,
    factors: [],
    recommendations:
      saving > 0.01
        ? [{
            id: `meet-${Date.now()}`,
            title: `Meet in ${best.city}`,
            description: `Meeting in ${best.city} instead of ${plan.city} ≈ ${fmtKg(best.totalKg)} CO₂e instead of ${fmtKg(plan.totalKg)}.`,
            savingsKg: Math.round(saving * 100) / 100,
            effort: "medium",
            category: "transport",
          }]
        : [],
    scopes: { scope1: 0, scope2: 0, scope3: plan.totalKg },
    breakdown: plan.legs.map((l) => ({
      label: `${l.fromCity} → ${plan.city} (${l.mode})`,
      quantity: l.people,
      unit: "people",
      kg: l.kg,
      scope: 3 as const,
      note: "return trip",
    })).concat(plan.hotelKg > 0 ? [{ label: "Hotel stays", quantity: req.nights, unit: "nights", kg: plan.hotelKg, scope: 3 as const, note: "" }] : []),
  };
}

export default function MeetingPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([
    { city: "Delhi", count: 5 },
    { city: "Mumbai", count: 3 },
    { city: "Bangalore", count: 2 },
    { city: "Mohali", count: 2 },
  ]);
  const [nights, setNights] = useState("2");
  const [venues, setVenues] = useState("");
  const [planned, setPlanned] = useState("Goa");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MeetingResult | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const valid = attendees.length > 0 && attendees.every((a) => a.city.trim() && a.count >= 1) && Number(nights) >= 0;
  const update = (i: number, patch: Partial<Attendee>) =>
    setAttendees((list) => list.map((a, j) => (j === i ? { ...a, ...patch } : a)));

  async function submit() {
    const req: MeetingRequest = {
      attendees: attendees.map((a) => ({ city: a.city.trim(), count: a.count })),
      nights: Number(nights) || 0,
      candidates: venues.split(",").map((v) => v.trim()).filter(Boolean),
      ...(planned.trim() && { plannedCity: planned.trim() }),
    };
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Sign in before saving meeting plans.");
      const res = await planMeeting(req, token);
      const people = legsTotal(req.attendees);
      const entry = createHistoryEntry(
        { prompt: `Team meeting: ${people} people from ${req.attendees.map((a) => a.city).join(", ")}${req.plannedCity ? ` (planned: ${req.plannedCity})` : ""}` },
        toPrediction(req, res)
      );
      await syncAccountHistory([entry], token);
      cacheHistoryEntry(entry);
      setResult(res);
      setOpen(res.candidates[0]?.city ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const best = result?.candidates[0];
  const plan = result?.candidates.find((c) => c.isPlanned);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Decide together"
        icon="pin"
        title="Meeting point"
        description="Where should a group meet? We compare venues by everyone's real journeys (each group's most viable way to travel) plus hotel nights."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.3fr] [&>*]:min-w-0">
        <Card>
          <div className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm">Who&apos;s coming, and from where?</legend>
              <div className="space-y-2">
                {attendees.map((a, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      aria-label={`City ${i + 1}`}
                      value={a.city}
                      onChange={(e) => update(i, { city: e.target.value })}
                      placeholder="City"
                      className="field min-w-0 flex-1 text-sm"
                    />
                    <input
                      aria-label={`People from city ${i + 1}`}
                      type="number"
                      min={1}
                      value={a.count}
                      onChange={(e) => update(i, { count: Math.max(1, Math.round(Number(e.target.value) || 1)) })}
                      className="field w-20 text-sm"
                    />
                    <button
                      onClick={() => setAttendees((list) => list.filter((_, j) => j !== i))}
                      disabled={attendees.length === 1}
                      aria-label={`Remove city ${i + 1}`}
                      className="rounded-full border border-line bg-surface px-3 text-sm text-ink/60 hover:text-clay disabled:opacity-40"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {attendees.length < 8 && (
                <button
                  onClick={() => setAttendees((list) => [...list, { city: "", count: 1 }])}
                  className="mt-2 text-sm text-moss underline"
                >
                  + Add a city
                </button>
              )}
            </fieldset>
            <label className="block text-sm">
              Nights at the venue
              <input
                type="number"
                min={0}
                value={nights}
                onChange={(e) => setNights(e.target.value)}
                className="field mt-1"
              />
            </label>
            <label className="block text-sm">
              Venues to compare <span className="text-ink/50">(optional, comma separated)</span>
              <input
                value={venues}
                onChange={(e) => setVenues(e.target.value)}
                placeholder="Leave empty and we'll suggest some"
                className="field mt-1"
              />
            </label>
            <label className="block text-sm">
              Venue you were planning <span className="text-ink/50">(optional)</span>
              <input
                value={planned}
                onChange={(e) => setPlanned(e.target.value)}
                placeholder="e.g. Goa"
                className="field mt-1"
              />
            </label>
            <Button disabled={loading || !valid} onClick={submit}>
              {loading ? "Comparing venues" : "Find the lowest-carbon venue"}
            </Button>
            {error && <ErrorMessage message={error} />}
          </div>
        </Card>

        <div className="space-y-4">
          {!result && <p className="text-sm text-ink/60">Results will appear here.</p>}
          {result && best && (
            <>
              <Card>
                <p className="text-sm text-ink/60">Lowest-carbon venue</p>
                <p className="mt-1 font-display font-semibold tracking-tight text-forest text-4xl">Meet in {best.city}</p>
                <p className="mt-1 text-sm text-ink/70">
                  {fmtKg(best.totalKg)} CO₂e for the whole group · longest journey {fmtHours(best.maxHours)}
                </p>
                {plan && result.savingVsPlannedKg != null && result.savingVsPlannedKg > 0.01 && (
                  <p className="mt-3 rounded-lg bg-moss/10 p-3 text-sm text-moss">
                    Saves {fmtKg(result.savingVsPlannedKg)} ({Math.round((result.savingVsPlannedKg / plan.totalKg) * 100)}%) compared
                    with meeting in {plan.city}.
                  </p>
                )}
                {plan && plan.recommended && (
                  <p className="mt-3 text-sm text-moss">Your planned venue is already the lowest-carbon choice.</p>
                )}
              </Card>

              {result.map && (
                <Card title={`Map · everyone travelling to ${best.city}`}>
                  <RouteMap data={result.map} label={`Map of attendee cities and the recommended venue, ${best.city}`} />
                </Card>
              )}

              <Card title="Total CO₂e by venue">
                <BarChart
                  legend={[
                    { name: "Lowest carbon", color: BEST },
                    ...(plan && !plan.recommended ? [{ name: "Your planned venue", color: PLANNED }] : []),
                    { name: "Other venues", color: OTHER },
                  ]}
                  rows={result.candidates.map((c) => ({
                    key: c.city,
                    label: `${c.city} · travel ${fmtKg(c.travelKg)} + hotels ${fmtKg(c.hotelKg)}`,
                    segments: [{
                      name: "Total",
                      value: c.totalKg,
                      color: c.recommended ? BEST : c.isPlanned ? PLANNED : OTHER,
                    }],
                  }))}
                />
              </Card>

              <Card title="How each group gets there">
                <div className="space-y-2">
                  {result.candidates.map((c) => (
                    <div key={c.city} className="rounded-lg border border-line">
                      <button
                        onClick={() => setOpen(open === c.city ? null : c.city)}
                        aria-expanded={open === c.city}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm"
                      >
                        <span className="font-medium">
                          {c.city}
                          {c.recommended && <span className="ml-2 rounded-full bg-sprout px-2 py-0.5 text-xs font-medium text-forest">Lowest carbon</span>}
                          {c.isPlanned && <span className="ml-2 rounded-full bg-clay/15 px-2 py-0.5 text-xs font-medium text-[#8a3a12]">Planned</span>}
                        </span>
                        <span className="tabular-nums text-ink/70">{fmtKg(c.totalKg)} {open === c.city ? "▴" : "▾"}</span>
                      </button>
                      {open === c.city && <LegTable candidate={c} />}
                    </div>
                  ))}
                </div>
                <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-ink/60">
                  {result.assumptions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </Card>
              <p className="text-sm text-ink/60">
                Saved to your <Link href="/result" className="text-moss underline">history</Link>, so it counts in your dashboard,
                Ghost You and net-zero plan.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LegTable({ candidate }: { candidate: MeetingCandidate }) {
  return (
    <div className="border-t border-line px-3 pb-3">
      <table className="w-full text-sm">
        <thead className="text-xs text-ink/60">
          <tr>
            <th className="py-1 pr-3 text-left font-medium">From</th>
            <th className="py-1 pr-3 text-left font-medium">Mode</th>
            {/* Time sits under the CO₂ figure so the table fits a phone */}
            <th className="py-1 text-right font-medium whitespace-nowrap">CO₂e · time</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {candidate.legs.map((l) => (
            <tr key={l.fromCity} className={cn("border-t border-line align-top", l.kg === 0 && "text-ink/50")}>
              <td className="py-1.5 pr-3 whitespace-nowrap">{l.fromCity} ×{l.people}</td>
              <td className="py-1.5 pr-3">
                {l.mode}
                {l.source && <span className="block text-[11px] text-ink/40">{l.source}</span>}
              </td>
              <td className="py-1.5 text-right whitespace-nowrap">
                {fmtKg(l.kg)}
                {l.hours ? <span className="block text-xs text-ink/50">{fmtHours(l.hours)} one way</span> : null}
              </td>
            </tr>
          ))}
          <tr className="border-t border-line">
            <td className="py-1.5 pr-3" colSpan={2}>Hotel stays</td>
            <td className="py-1.5 text-right whitespace-nowrap">{fmtKg(candidate.hotelKg)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
