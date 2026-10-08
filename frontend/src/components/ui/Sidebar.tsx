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
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                      active ? "bg-sprout font-semibold text-forest shadow-sm" : "text-white/72 hover:bg-white/10 hover:text-white"
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

/** Compact motion graphic for the sidebar's foot. */
function Foliage() {
  return (
    <div className="pointer-events-none absolute inset-x-5 bottom-5 h-24 rounded-2xl bg-[linear-gradient(135deg,rgba(185,230,109,0.2),rgba(91,145,165,0.1)),radial-gradient(circle_at_75%_22%,rgba(255,255,255,0.14),transparent_32%)] opacity-80" aria-hidden>
      <div className="absolute bottom-4 left-5 h-12 w-3 rounded-full bg-sprout/50" />
      <div className="absolute bottom-4 left-10 h-16 w-3 rounded-full bg-sky/40" />
      <div className="absolute bottom-4 left-16 h-9 w-3 rounded-full bg-clay/50" />
      <div className="absolute right-5 top-4 h-10 w-10 rounded-2xl border border-white/15" />
    </div>
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
      <aside className="relative hidden h-screen w-64 shrink-0 flex-col overflow-hidden bg-forest shadow-[18px_0_48px_-42px_rgba(16,38,31,0.8)] lg:sticky lg:top-0 lg:flex 2xl:w-72">
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
          <div className="relative z-10 rounded-2xl border border-white/10 bg-[#18352b] p-4 text-xs leading-relaxed text-white/72 shadow-[0_18px_36px_-30px_rgba(0,0,0,0.75)]">
            <p className="font-display text-sm text-sprout">Prevent, don&apos;t just measure.</p>
            Predict a decision&apos;s footprint before you make it.
          </div>
        </div>
        <Foliage />
      </aside>

      <header data-app-header className="sticky top-0 z-40 flex items-center justify-between bg-forest px-4 py-3 shadow-lg lg:hidden">
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
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-forest/70" onClick={() => setOpen(false)} aria-label="Close menu" />
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
