"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/ui/Sidebar";

// Sign-in screens are full-bleed welcome pages, without the app's navigation
const BARE_ROUTES = ["/login", "/signup"];

export function AppFrame({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (BARE_ROUTES.includes(path)) return <>{children}</>;
  return (
    <div className="app-shell lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 px-3 pb-12 pt-4 sm:px-5 lg:px-8 lg:pt-8 2xl:px-10">
        <div className="content-shell">{children}</div>
      </main>
    </div>
  );
}
