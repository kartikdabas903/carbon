"use client";
import { useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { AIRequest } from "@/types/ai";

// Minimal typing for the browser's Web Speech API (Chrome/Edge expose it as webkitSpeechRecognition)
interface Recognition {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => Recognition;

function getRecognition(): RecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const noSubscribe = () => () => {};

const EXAMPLES = [
  "Going from Mohali to Delhi",
  "Building a 2 storey house in Mohali",
  "Running a 1.5 kW AC for 6 hours in Mumbai",
  "2-day conference in Goa for 40 people from Delhi",
];

export function AIInput({
  onSubmit,
  loading,
  initialPrompt = "",
}: {
  onSubmit: (r: AIRequest) => void;
  loading?: boolean;
  initialPrompt?: string;
}) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [distance, setDistance] = useState("");
  const [listening, setListening] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const canListen = useSyncExternalStore(noSubscribe, () => !!getRecognition(), () => false);
  const distanceKm = Number(distance);
  const distanceInvalid = distance.trim() !== "" && !(distanceKm > 0);

  function submit() {
    onSubmit({ prompt: prompt.trim(), ...(distance.trim() && { distanceKm }) });
  }

  function toggleVoice() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const Ctor = getRecognition();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "en-IN";
    r.interimResults = true;
    const before = prompt.trim();
    r.onresult = (e) => {
      const heard = Array.from(e.results, (res) => res[0].transcript).join("");
      setPrompt(before ? `${before} ${heard}` : heard);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recognition.current = r;
    setListening(true);
    r.start();
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        Message the CarbonShift assistant
        <span className="relative mt-1 block">
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a plan, or add a detail to revise your last estimate."
            className={cn("field", canListen && "pr-12")}
          />
          {canListen && (
            <button
              type="button"
              onClick={toggleVoice}
              aria-label={listening ? "Stop listening" : "Speak your activity"}
              aria-pressed={listening}
              className={cn(
                "absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border transition",
                listening ? "animate-pulse border-clay bg-clay text-white" : "border-line text-ink/70 hover:bg-line/40"
              )}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </button>
          )}
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setPrompt(ex)}
            className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink/70 transition hover:border-fern/50 hover:bg-sage/60"
          >
            {ex}
          </button>
        ))}
      </div>
      <label className="block text-sm">
        Distance in km <span className="text-ink/50">(optional)</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          placeholder="Leave empty to estimate it"
          className="field mt-1"
        />
        {distanceInvalid && <span className="mt-1 block text-xs text-clay">Enter a distance greater than 0.</span>}
      </label>
      <Button disabled={loading || prompt.trim().length < 5 || distanceInvalid} onClick={submit}>
        {loading ? "Thinking" : "Send to assistant"}
      </Button>
    </div>
  );
}
