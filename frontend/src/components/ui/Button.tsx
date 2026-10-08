import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "light" }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fern",
        variant === "primary" && "bg-forest text-white shadow-[0_14px_28px_-18px_rgba(15,42,31,0.75)] hover:bg-moss",
        variant === "ghost" && "border border-line bg-surface-strong text-ink hover:border-fern/50 hover:bg-sage/60",
        variant === "light" && "bg-sprout text-forest hover:bg-white",
        className
      )}
    />
  );
}
