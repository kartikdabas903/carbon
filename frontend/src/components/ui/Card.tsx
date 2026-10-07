import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({
  title,
  children,
  className,
  action,
  compact = false,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  compact?: boolean; // tighter padding on phones, for small tiles
}) {
  return (
    <section
      className={cn(
        // min-w-0 lets cards shrink inside grids instead of pushing the page wider than the screen
        "min-w-0 rounded-3xl border border-line/80 bg-surface text-ink shadow-[0_1px_2px_rgba(15,42,31,0.04),0_12px_32px_-18px_rgba(15,42,31,0.18)] md:p-6",
        compact ? "p-3.5" : "p-5",
        className
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink/75">
              <span className="h-1.5 w-1.5 rounded-full bg-fern" aria-hidden />
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
