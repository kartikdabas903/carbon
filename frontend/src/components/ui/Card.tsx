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
        "surface-panel min-w-0 rounded-2xl text-ink md:p-6",
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
