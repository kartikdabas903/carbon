"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { fmtKg, fmtMoney } from "@/lib/utils";
import type { MapRoute, TravelMap } from "@/types/ai";

const COLORS = { best: "#0f8a6a", plan: "#c4622d", other: "#8a968c" } as const;
const WEIGHTS = { best: 5, plan: 4, other: 3 } as const;
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const fmtHours = (h: number | null) => {
  if (!h) return "";
  const mins = Math.round(h * 60);
  return mins >= 60 ? `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, "0")} min` : `${mins} min`;
};

/** Points along a gentle curve between two [lat, lon] ends, so flights read as flights. */
function arc(a: [number, number], b: [number, number], steps = 48): [number, number][] {
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const ctrl: [number, number] = [(lat1 + lat2) / 2 + (lon2 - lon1) * 0.18, (lon1 + lon2) / 2 - (lat2 - lat1) * 0.18];
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return [u * u * lat1 + 2 * u * t * ctrl[0] + t * t * lat2, u * u * lon1 + 2 * u * t * ctrl[1] + t * t * lon2];
  });
}

function popupHtml(route: MapRoute, currency?: string | null) {
  const rows = route.options
    .map((o) => {
      const badge = o.recommended ? " <b style='color:#0f8a6a'>· most viable</b>" : o.isPlan ? " <b style='color:#c4622d'>· your plan</b>" : "";
      const cost = fmtMoney(o.cost, currency);
      return `<li><b>${esc(o.title)}</b>${badge}<br>${fmtKg(o.kg)} CO₂e${o.hours ? ` · ${fmtHours(o.hours)}` : ""}${cost ? ` · ${esc(cost)}` : ""}</li>`;
    })
    .join("");
  return `<div style="font:13px/1.4 system-ui,sans-serif;min-width:190px">
    <div style="font-weight:600;margin-bottom:4px">${esc(route.label)}</div>
    ${rows ? `<ul style="margin:0;padding-left:16px">${rows}</ul>` : ""}
    ${route.detail ? `<div>${esc(route.detail)}</div>` : ""}
    ${route.approximate ? `<div style="color:#666;margin-top:4px">Line drawn straight; not the actual route.</div>` : ""}
  </div>`;
}

/**
 * Travel options on a map: one line per way of travelling, coloured by which is the
 * most viable (green) or your plan (orange). Click a line for its CO₂, time and cost.
 */
export function RouteMap({ data, currency, label }: { data: TravelMap; currency?: string | null; label: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let map: import("leaflet").Map | undefined;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      map = L.map(el, { scrollWheelZoom: false, attributionControl: true });
      if (MAPTILER_KEY) {
        L.tileLayer(`https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`, {
          maxZoom: 18,
          attribution:
            '<a href="https://www.maptiler.com/copyright/" target="_blank">© MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
        }).addTo(map);
      } else {
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
        }).addTo(map);
      }
      map.attributionControl.addAttribution(data.attribution.filter((a) => !a.includes("OpenStreetMap")).map(esc).join(" · "));

      const bounds = L.latLngBounds([]);
      // Draw others first so the most viable route sits on top
      const order = { other: 0, plan: 1, best: 2 } as const;
      for (const route of [...data.routes].sort((a, b) => order[a.highlight] - order[b.highlight])) {
        const coords = route.mode === "flight" && route.coords.length === 2 ? arc(route.coords[0], route.coords[1]) : route.coords;
        const line = L.polyline(coords, {
          color: COLORS[route.highlight],
          weight: WEIGHTS[route.highlight],
          opacity: route.highlight === "other" ? 0.75 : 0.95,
          dashArray: route.approximate ? "6 8" : undefined,
          lineCap: "round",
        }).addTo(map);
        // A wider invisible line makes thin routes easy to click or tap
        L.polyline(coords, { weight: 18, opacity: 0 }).addTo(map).bindPopup(popupHtml(route, currency));
        line.bindPopup(popupHtml(route, currency));
        coords.forEach((c) => bounds.extend(c));
      }
      for (const p of data.points) {
        const major = p.kind !== "airport";
        L.circleMarker([p.lat, p.lon], {
          radius: major ? 7 : 5,
          color: "#ffffff",
          weight: 2,
          fillColor: p.kind === "airport" ? "#475569" : p.highlight === "other" ? "#12261d" : COLORS[p.highlight],
          fillOpacity: 1,
        })
          .addTo(map)
          // Spread permanent labels around their dots so nearby cities don't cover each other
          .bindTooltip(esc(p.name), {
            permanent: major,
            direction: p.kind === "origin" ? "right" : p.kind === "destination" ? "bottom" : p.kind === "venue" ? "left" : "top",
            offset: p.kind === "origin" ? [8, 0] : p.kind === "destination" ? [0, 8] : p.kind === "venue" ? [-8, 0] : [0, -6],
          })
          .bindPopup(`<b>${esc(p.name)}</b>${p.detail ? `<br>${esc(p.detail)}` : ""}`);
        bounds.extend([p.lat, p.lon]);
      }
      // Extra bottom padding keeps labels clear of the attribution bar
      if (bounds.isValid()) map.fitBounds(bounds, { paddingTopLeft: [36, 36], paddingBottomRight: [36, 64] });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [data, currency]);

  return (
    <div>
      <div ref={ref} role="region" aria-label={label} className="h-80 w-full overflow-hidden rounded-xl border border-line" />
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/70">
        <li className="flex items-center gap-1.5"><span className="h-1 w-5 rounded" style={{ background: COLORS.best }} />Most viable</li>
        {data.routes.some((r) => r.highlight === "plan") && (
          <li className="flex items-center gap-1.5"><span className="h-1 w-5 rounded" style={{ background: COLORS.plan }} />Your plan</li>
        )}
        {data.routes.some((r) => r.highlight === "other") && (
          <li className="flex items-center gap-1.5"><span className="h-1 w-5 rounded" style={{ background: COLORS.other }} />Other options</li>
        )}
        {data.routes.some((r) => r.approximate) && (
          <li className="flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed border-ink/50" />Straight line, not the actual route</li>
        )}
        <li className="text-ink/50">Tap a line for CO₂, time and cost</li>
      </ul>
    </div>
  );
}
