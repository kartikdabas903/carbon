import { fmtKg } from "@/lib/utils";
import type { BreakdownLine } from "@/types/ai";

const fmtQty = (n: number) =>
  n >= 100 ? Math.round(n).toLocaleString("en-IN") : n >= 1 ? (+n.toFixed(1)).toLocaleString("en-IN") : String(+n.toFixed(3));

/** Every line the estimate counted, with quantities: for construction, the bill of materials and machines. */
export function BreakdownTable({ lines }: { lines: BreakdownLine[] }) {
  const total = lines.reduce((s, l) => s + l.kg, 0) || 1;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="text-xs text-ink/60">
          <tr>
            <th className="py-1 pr-3 font-medium">Item</th>
            <th className="py-1 pr-3 text-right font-medium">Quantity</th>
            <th className="py-1 pr-3 text-right font-medium">CO₂e</th>
            <th className="py-1 text-right font-medium">Share</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {lines.map((l, i) => (
            <tr key={`${i}-${l.label}`} className="border-t border-line align-top">
              <td className="py-1.5 pr-3">
                {l.label}
                {l.note && <span className="block text-xs text-ink/50">{l.note}</span>}
                {l.source && <span className="block text-[11px] text-ink/40">{l.source}</span>}
              </td>
              <td className="py-1.5 pr-3 text-right whitespace-nowrap">
                {fmtQty(l.quantity)} {l.unit}
              </td>
              <td className="py-1.5 pr-3 text-right whitespace-nowrap">{fmtKg(l.kg)}</td>
              <td className="py-1.5 text-right">{Math.round((l.kg / total) * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
