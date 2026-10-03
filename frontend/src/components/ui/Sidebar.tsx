"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calculate", label: "Calculate" },
  { href: "/ai", label: "Predict" },
  { href: "/result", label: "Result" },
  { href: "/recommendations", label: "Recommendations" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="bg-forest text-white md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-lime text-forest">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14Z" />
            <path d="M5 19c3-5 6-8 10-10" />
          </svg>
        </span>
        <span className="text-lg font-semibold tracking-tight">CarbonFlow</span>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
        {NAV.map((n) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition",
                active ? "bg-lime font-medium text-forest" : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-forest" : "bg-white/30")} />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden p-4 md:block">
        <div className="rounded-xl bg-white/10 p-4 text-xs leading-relaxed text-white/70">
          Predict emissions before the activity happens, not after.
        </div>
      </div>
    </aside>
  );
}