import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-line bg-white p-5 text-ink shadow-[0_1px_2px_rgba(14,42,32,0.04),0_8px_24px_-12px_rgba(14,42,32,0.12)]",
        className
      )}
    >
      {title && <h2 className="mb-4 text-sm font-semibold text-ink/70">{title}</h2>}
      {children}
    </section>
  );
}