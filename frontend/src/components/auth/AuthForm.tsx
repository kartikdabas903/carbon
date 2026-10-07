"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { supabase } from "@/lib/supabase";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!supabase) {
      setError("Add the public Supabase URL and anon key to frontend/.env.local first.");
      return;
    }
    setBusy(true);
    try {
      const result = isSignup
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (isSignup && !result.data.session) {
        setMessage("Check your email to confirm your account, then sign in.");
      } else {
        router.replace("/ai");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        eyebrow="Account"
        icon="history"
        title={isSignup ? "Create your account" : "Welcome back"}
        description={isSignup ? "Save predictions, choices, and your carbon goal to your account." : "Sign in to continue with your saved decisions and goals."}
      />
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm">
            Email
            <input className="field mt-1" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm">
            Password
            <span className="relative mt-1 block">
              <input className="field pr-12" type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink/55 hover:bg-paper hover:text-ink"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 9 4 10 7a11 11 0 0 1-3 4.3M6.2 6.2A11.4 11.4 0 0 0 2 12c1 3 5 7 10 7 1.2 0 2.3-.2 3.3-.6" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                )}
              </button>
            </span>
          </label>
          {error && <p role="alert" className="text-sm text-clay">{error}</p>}
          {message && <p role="status" className="text-sm text-moss">{message}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-60">
            {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-sm text-ink/65">
          {isSignup ? "Already have an account? " : "New to CarbonShift? "}
          <Link className="font-medium text-moss underline" href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link>
        </p>
      </Card>
    </div>
  );
}