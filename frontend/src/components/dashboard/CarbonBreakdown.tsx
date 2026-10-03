import { Card } from "@/components/ui/Card";
import { fmtKg } from "@/lib/utils";
import type { BreakdownItem } from "@/types/carbon";

export function CarbonBreakdown({ items }: { items: BreakdownItem[] }) {
  const total = items.reduce((s, i) => s + i.emissionsKg, 0) || 1;
  return (
    <Card title="By activity">
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.category} className="text-sm">
            <div className="flex justify-between">
              <span className="capitalize">{i.category}</span>
              <span>{fmtKg(i.emissionsKg)}</span>
            </div>
            <div className="mt-1 h-2 rounded bg-line">
              <div className="h-full rounded bg-moss" style={{ width: `${(i.emissionsKg / total) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}