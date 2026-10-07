"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { AccountControls } from "@/components/auth/AccountControls";

const GROUPS: { title?: string; items: { href: string; label: string; icon: IconName }[] }[] = [
  { items: [{ href: "/", label: "Home", icon: "home" }] },
  {
    title: "Decide",
    items: [
      { href: "/ai", label: "Predict a decision", icon: "sparkle" },
      { href: "/meeting", label: "Meeting point", icon: "pin" },
      { href: "/calculate", label: "Calculator", icon: "calc" },
    ],
  },
  {
    title: "Track",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "chart" },
      { href: "/result", label: "History", icon: "history" },
      { href: "/recommendations", label: "Recommendations", icon: "bulb" },
    ],
  },
  {
    title: "Plan",
    items: [
      { href: "/ghost", label: "Ghost You", icon: "ghost" },
      { href: "/net-zero", label: "Net-zero plan", icon: "target" },
      { href: "/report", label: "Report", icon: "doc" },
    ],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="space-y-5 px-3" aria-label="Main">
      {GROUPS.map((g, i) => (
        <div key={i}>
          {g.title && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">{g.title}</p>}
          <ul className="space-y-0.5">
            {g.items.map((n) => {
              const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                      active ? "bg-sprout font-medium text-forest shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon name={n.icon} className={cn("h-[18px] w-[18px] transition", !active && "opacity-70 group-hover:opacity-100")} />
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Leafy line art for the sidebar's foot. */
function Foliage() {
  return (
    <svg viewBox="0 0 240 120" className="pointer-events-none absolute inset-x-0 bottom-0 w-full opacity-[0.18]" aria-hidden>
      <path d="M-10 120C40 70 90 60 130 75s80 15 120-20v65z" fill="#c8e88a" />
      <path d="M30 120c4-30 18-52 40-66M70 54c-12 2-22-4-26-14 12-2 22 4 26 14zM56 80c-12 0-20-8-22-18 12 0 20 8 22 18z" stroke="#c8e88a" strokeWidth="2" fill="none" />
      <path d="M190 120c-2-26 6-46 24-60M214 60c-10 4-20 0-26-8 10-4 20 0 26 8z" stroke="#c8e88a" strokeWidth="2" fill="none" />
    </svg>
  );
}

/** Desktop: fixed forest sidebar. Phone: top bar with a slide-out menu. */
export function Sidebar() {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  // Close the phone menu with Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <aside className="relative hidden h-screen w-64 shrink-0 flex-col overflow-hidden bg-forest md:sticky md:top-0 md:flex">
        <Link href="/" className="px-6 pb-6 pt-6" aria-label="CarbonShift home">
          <Logo />
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto pb-40">
          <NavLinks />
        </div>
        <div className="mb-4">
          <AccountControls />
        </div>
        <div className="relative px-5 pb-6">
          <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-white/70 backdrop-blur">
            <p className="font-display text-sm text-sprout">Prevent, don&apos;t just measure.</p>
            Predict a decision&apos;s footprint before you make it.
          </div>
        </div>
        <Foliage />
      </aside>

      <header data-app-header className="sticky top-0 z-40 flex items-center justify-between bg-forest px-4 py-3 md:hidden">
        <Link href="/" aria-label="CarbonShift home">
          <Logo />
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="rounded-xl p-2 text-white hover:bg-white/10"
        >
          <Icon name="menu" className="h-6 w-6" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-forest/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div key={path} className="animate-rise absolute inset-y-0 left-0 flex w-72 flex-col overflow-y-auto bg-forest pb-8 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-xl p-2 text-white hover:bg-white/10">
                <Icon name="close" className="h-6 w-6" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="mt-6">
              <AccountControls />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
