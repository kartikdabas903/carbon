"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CarbonInput } from "@/components/carbon/CarbonInput";
import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { calculateCarbon } from "@/lib/api";
import { saveSession } from "@/lib/utils";
import type { CarbonInputData } from "@/types/carbon";

export default function CalculatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(d: CarbonInputData) {
    setLoading(true);
    setError("");
    try {
      saveSession("carbon:result", await calculateCarbon(d));
      router.push("/result");
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
   <h1 className="text-2xl font-semibold tracking-tight text-ink">
      Calculate emissions
    </h1>
      <Card>
        <CarbonInput onSubmit={submit} loading={loading} />
      </Card>
      {error && <ErrorMessage message={error} />}
    </div>
  );
}