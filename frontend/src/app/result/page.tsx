"use client";
import Link from "next/link";
import { CarbonResult } from "@/components/carbon/CarbonResult";
import { loadSession } from "@/lib/utils";
import type { CarbonResultData } from "@/types/carbon";
import { useState, useEffect } from "react";

export default function ResultPage() {
  const [data, setData] = useState<CarbonResultData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setData(loadSession<CarbonResultData>("carbon:result"));
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!data)
    return (
      <p className="text-sm">
        No result yet. <Link href="/calculate" className="text-moss underline">Calculate an activity</Link>.
      </p>
    );

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Result</h1>
      <CarbonResult data={data} />
      <div className="flex gap-4 text-sm">
        <Link href="/ai" className="text-moss underline">Get a prediction and advice</Link>
        <Link href="/calculate" className="underline">Calculate another</Link>
      </div>
    </div>
  );
}