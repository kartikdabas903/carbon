"use client";

import type { ReactElement } from "react";
import { ResponsiveContainer } from "recharts";

export const chartTooltipStyle = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: "8px",
  color: "var(--ink)",
  boxShadow: "0 8px 24px rgba(15, 42, 31, 0.12)",
};

export const chartTickStyle = { fill: "var(--ink)", fontSize: 11 };

export function ChartContainer({
  children,
  height,
  label,
}: {
  children: ReactElement;
  height: number;
  label: string;
}) {
  return (
    <div className="w-full min-w-0" role="group" aria-label={label}>
      <ResponsiveContainer width="100%" height={height} minWidth={0}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}