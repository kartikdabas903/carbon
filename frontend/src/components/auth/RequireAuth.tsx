"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, configured } = useAuth();
  const publicRoute = pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    if (!ready || publicRoute || (configured && user)) return;
    router.replace("/login");
  }, [configured, pathname, publicRoute, ready, router, user]);

  if (publicRoute) return children;
  if (!ready) return <div className="grid min-h-screen place-items-center text-sm text-ink/60" role="status">Checking your sign-in…</div>;
  if (!configured) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-forest">Account setup required</h1>
        <p className="mt-3 text-sm text-ink/65">Configure Supabase to use CarbonShift. Sign-in is required before accessing predictions and saved data.</p>
        <Link href="/login" className="mt-5 inline-block rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white">Open sign in</Link>
      </div>
    );
  }
  if (!user) return <p className="py-16 text-center text-sm text-ink/60" role="status">Redirecting to sign in…</p>;
  return children;
}