"use client";

import { useState } from "react";

export function PredictionFollowup({
  enabled,
  loading,
  onAsk,
}: {
  enabled: boolean;
  loading: boolean;
  onAsk: (question: string) => void;
}) {
  const [question, setQuestion] = useState("");

  function submit() {
    const value = question.trim();
    if (!value || !enabled || loading) return;
    setQuestion("");
    onAsk(value);
  }

  return (
    <section aria-labelledby="prediction-followup-title">
      <h2 id="prediction-followup-title" className="text-sm font-semibold text-ink/75">Ask about this prediction</h2>
      <label className="mt-2 block text-sm text-ink/70" htmlFor="prediction-followup">Questions and small changes</label>
      <textarea
        id="prediction-followup"
        rows={2}
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder={enabled ? "Why was this factor used? Could you compare a smaller group?" : "Run a prediction first to ask a follow-up."}
        disabled={!enabled || loading}
        className="field mt-2 resize-y disabled:opacity-55"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-ink/45">Enter to send · Shift+Enter for a new line</span>
        <button
          type="button"
          onClick={submit}
          disabled={!enabled || loading || question.trim().length < 2}
          aria-label="Send prediction question"
          title="Send question"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? <span className="text-xs">…</span> : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M4 12 20 4l-5 16-3-6-8-2Z" />
              <path d="m12 14 4-5" />
            </svg>
          )}
        </button>
      </div>
    </section>
  );
}