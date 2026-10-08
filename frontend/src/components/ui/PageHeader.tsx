import type { ReactNode } from "react";

/** Consistent page title: serif heading, one-line purpose, optional actions. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="animate-rise mb-6 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-line/80 bg-surface/80 p-4 shadow-[0_18px_48px_-36px_rgba(16,38,31,0.42)] print:hidden md:mb-8 md:p-5">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-forest md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/65 md:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
