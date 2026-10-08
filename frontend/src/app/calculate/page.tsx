"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CarbonInput } from "@/components/carbon/CarbonInput";
import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { calculateCarbon } from "@/lib/api";
import { cacheHistoryEntry, createCalculationEntry } from "@/lib/history";
import { getAccessToken, syncAccountHistory } from "@/lib/account";
import type { CarbonInputData } from "@/types/carbon";
import { PageHeader } from "@/components/ui/PageHeader";

export default function CalculatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(d: CarbonInputData) {
    setLoading(true);
    setError("");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Sign in before saving calculations.");
      const result = await calculateCarbon(d, token);
      const entry = createCalculationEntry(d, result);
      await syncAccountHistory([entry], token);
      cacheHistoryEntry(entry);
      router.push("/result");
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Calculator" description="Know the exact activity and amount? Pick it here for an exact, sourced calculation." />
      <Card>
        <CarbonInput onSubmit={submit} loading={loading} />
      </Card>
      {error && <ErrorMessage message={error} />}
    </div>
  );
}