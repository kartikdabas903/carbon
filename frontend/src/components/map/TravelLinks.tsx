import type { TripOption } from "@/types/ai";

/** Go from the decision straight to booking or directions. No API needed: plain links. */
export function TravelLinks({
  from,
  to,
  options,
  region,
}: {
  from: string;
  to: string;
  options: TripOption[];
  region?: string | null;
}) {
  const has = (re: RegExp) => options.some((o) => re.test(o.title));
  const india = region === "IN";
  const q = encodeURIComponent;
  const links = [
    {
      label: "Directions in Google Maps",
      href: `https://www.google.com/maps/dir/?api=1&origin=${q(from)}&destination=${q(to)}&travelmode=${has(/train|bus|coach|metro/i) ? "transit" : "driving"}`,
    },
    ...(has(/train|rail|shatabdi|express/i) && india ? [{ label: "Find trains on IRCTC", href: "https://www.irctc.co.in/nget/train-search" }] : []),
    ...(has(/bus|coach/i) && india ? [{ label: "Find buses on redBus", href: "https://www.redbus.in/" }] : []),
    ...(has(/flight|fly/i)
      ? [{ label: "Compare flights (with CO₂) on Google Flights", href: `https://www.google.com/travel/flights?q=${q(`Flights from ${from} to ${to}`)}` }]
      : []),
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-line px-3 py-1 text-sm text-moss hover:bg-moss/10"
        >
          {l.label} ↗
        </a>
      ))}
    </div>
  );
}
