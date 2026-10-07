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
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fern",
        variant === "primary" && "bg-forest text-white shadow-[0_6px_16px_-8px_rgba(15,42,31,0.6)] hover:bg-moss",
        variant === "ghost" && "border border-line bg-surface text-ink hover:border-fern/50 hover:bg-sage/60",
        variant === "light" && "bg-sprout text-forest hover:bg-white",
        className
      )}
    />
  );
}
