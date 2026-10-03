"use client";
import { useEffect, useState } from "react";
import { getDashboard } from "@/lib/api";
import { CarbonOverview } from "@/components/dashboard/CarbonOverview";
import { CarbonBreakdown } from "@/components/dashboard/CarbonBreakdown";
import { ReductionChart } from "@/components/dashboard/ReductionChart";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import type { DashboardData } from "@/types/carbon";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorMessage message={error} />;
  if (!data) return <Spinner label="Loading dashboard" />;

  return (
    <div className="space-y-6">
     <h1 className="text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>
      <CarbonOverview totalKg={data.totalKg} avoidedKg={data.avoidedKg} />
      <div className="grid gap-4 lg:grid-cols-2">
        <CarbonBreakdown items={data.breakdown} />
        <ReductionChart data={data.trend} />
      </div>
    </div>
  );
}