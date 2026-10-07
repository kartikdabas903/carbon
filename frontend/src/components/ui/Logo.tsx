import { cn } from "@/lib/utils";

/** CarbonShift mark: a leaf whose midrib curls into a "shift" arrow. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="none">
      <rect width="32" height="32" rx="10" fill="#c8e88a" />
      <path d="M8 23c0-9 6-15 16-15 0 10-6 16-15 16" fill="#2f8f5b" />
      <path d="M9 24c3.5-5.5 7-8.5 11.5-10.5" stroke="#0f2a1f" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 12.6l3.6 0.8-1.2 3.4" stroke="#0f2a1f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="h-9 w-9 shrink-0" />
      <span className={cn("font-display text-xl font-semibold tracking-tight", tone === "light" ? "text-white" : "text-forest")}>
        Carbon<span className={tone === "light" ? "text-sprout" : "text-fern"}>Shift</span>
      </span>
    </span>
  );
}
