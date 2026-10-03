"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { AIRequest } from "@/types/ai";

export function AIInput({
  onSubmit,
  loading,
}: {
  onSubmit: (r: AIRequest) => void;
  loading?: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  return (
    <div className="space-y-3">
      <label className="block text-sm">
        Describe the planned activity
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. 12 staff driving 40 km to a site visit on Friday morning"
          className="mt-1 w-full rounded-md border border-line px-3 py-2"
        />
      </label>
      <Button disabled={loading || prompt.trim().length < 5} onClick={() => onSubmit({ prompt: prompt.trim() })}>
        {loading ? "Predicting" : "Predict emissions"}
      </Button>
    </div>
  );
}