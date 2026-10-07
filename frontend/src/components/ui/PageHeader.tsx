import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

/** Consistent page title: section eyebrow, serif heading, one-line purpose, optional actions. */
export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  icon?: IconName;
  actions?: ReactNode;
}) {
  return (
    <header className="animate-rise mb-8 flex flex-wrap items-end justify-between gap-4 print:hidden">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-fern">
          {icon && <Icon name={icon} className="h-4 w-4" />}
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-forest md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/65 md:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
