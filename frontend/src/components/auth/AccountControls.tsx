"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

export function AccountControls() {
  const { user, configured, ready, cloudError } = useAuth();

  if (!configured) {
    return <p className="px-3 text-xs text-white/55">Cloud accounts not configured</p>;
  }

  if (!ready) return <p className="px-3 text-xs text-white/55">Loading account…</p>;

  if (user) {
    return (
      <div className="mx-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <Link href="/profile" className="min-w-0 truncate text-xs text-white/75 hover:text-white" title={user.email ?? "Profile"}>
            {user.email ?? "Profile"}
          </Link>
          <button type="button" onClick={() => { void supabase?.auth.signOut(); }} className="shrink-0 text-xs font-medium text-sprout hover:text-white">
            Sign out
          </button>
        </div>
        {cloudError && <p role="status" className="mt-2 text-xs text-sprout">Cloud sync: {cloudError}</p>}
      </div>
    );
  }

  return (
    <div className="flex gap-2 px-3">
      <Link href="/login" className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-center text-xs font-medium text-white/80 hover:bg-white/10">Sign in</Link>
      <Link href="/signup" className="flex-1 rounded-lg bg-sprout px-3 py-2 text-center text-xs font-semibold text-forest hover:bg-white">Create account</Link>
    </div>
  );
}