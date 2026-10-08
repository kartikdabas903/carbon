"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Leaves } from "@/components/ui/Leaves";
import { supabase } from "@/lib/supabase";

const BENEFITS: { icon: IconName; title: string; text: string }[] = [
  { icon: "sparkle", title: "Predict before you decide", text: "Describe a trip, purchase or build in plain words." },
  { icon: "shield", title: "Real, cited data", text: "110 published factors, live grid and route data." },
  { icon: "chart", title: "Track what you avoid", text: "Every better choice adds to your saved total." },
];

// A real prediction from the engine, shown as a teaser
const EXAMPLE = [
  { label: "Car (petrol)", kg: 51, color: "var(--chart-planned)" },
  { label: "Train (AC chair)", kg: 8.6, color: "var(--chart-reduced)" },
];

// 0–4: length, mixed case, digit, symbol
function strength(pw: string) {
  if (!pw) return 0;
  let s = pw.length >= 8 ? 1 : 0;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}
const STRENGTH_LABEL = ["Too short", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = ["bg-clay", "bg-clay", "bg-amber-500", "bg-fern", "bg-moss"];

function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={`grid h-10 w-10 place-items-center rounded-2xl ${light ? "bg-sprout text-forest" : "bg-forest text-sprout"} shadow-sm`}>
        <Icon name="leaf" className="h-5 w-5" />
      </span>
      <span className={`font-display text-xl font-semibold tracking-tight ${light ? "text-white" : "text-forest"}`}>CarbonShift</span>
    </span>
  );
}

function ExampleCard() {
  const max = EXAMPLE[0].kg;
  const saved = Math.round((1 - EXAMPLE[1].kg / EXAMPLE[0].kg) * 100);
  return (
    <div className="animate-rise rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-md [animation-delay:200ms]">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-white">
          <Icon name="route" className="h-4 w-4 text-sprout" />
          Mohali → Delhi · 250 km
        </p>
      </div>
      <ul className="mt-4 space-y-3">
        {EXAMPLE.map((row, i) => (
          <li key={row.label}>
            <div className="flex justify-between text-xs text-white/75">
              <span>{row.label}</span>
              <span className="tabular-nums font-semibold text-white">{row.kg} kg CO₂e</span>
            </div>
            <div className="mt-1 h-2.5 rounded-full bg-white/10">
              <div
                className="animate-grow-x h-full rounded-full"
                style={{ width: `${(row.kg / max) * 100}%`, background: row.color, animationDelay: `${400 + i * 250}ms` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-center gap-2 text-sm text-white">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-sprout text-forest"><Icon name="check" className="h-3.5 w-3.5" /></span>
        Take the train and avoid <strong className="text-sprout">~{saved}%</strong> of the emissions.
      </p>
    </div>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />;
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const isSignup = mode === "signup";
  const score = strength(password);

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

  async function resetPassword() {
    setError("");
    setMessage("");
    if (!supabase) {
      setError("Add the public Supabase URL and anon key to frontend/.env.local first.");
      return;
    }
    if (!email) {
      setError("Enter your email above first, then choose “Forgot password?”.");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
    setBusy(false);
    if (err) setError(err.message);
    else setMessage("If that email has an account, a reset link is on its way.");
  }

  const tab = (active: boolean) =>
    `flex-1 rounded-xl px-3 py-2 text-center text-sm font-semibold transition ${active ? "bg-surface-strong text-forest shadow-sm" : "text-ink/55 hover:text-ink"}`;

  return (
    <div className="min-h-dvh bg-mist lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-[radial-gradient(120%_90%_at_10%_0%,#26634d_0%,#10261f_55%,#0b1b16_100%)] text-white lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <Leaves className="opacity-70" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-sprout/10 blur-3xl" aria-hidden />
        <div className="relative"><BrandMark light /></div>

        <div className="relative mx-auto w-full max-w-lg space-y-8 py-10">
          <div className="animate-rise">
            <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight xl:text-5xl">
              Know the carbon <span className="text-sprout">before</span> you choose.
            </h1>
            <p className="mt-4 max-w-md text-base text-white/70">
              CarbonShift predicts the footprint of your next trip, purchase or project, and shows the greener option that still works.
            </p>
          </div>
          <ExampleCard />
          <ul className="stagger grid gap-4">
            {BENEFITS.map((b) => (
              <li key={b.title} className="animate-rise flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-sprout"><Icon name={b.icon} className="h-4 w-4" /></span>
                <span>
                  <span className="block text-sm font-semibold">{b.title}</span>
                  <span className="block text-sm text-white/60">{b.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/45">Data: IPCC · DEFRA · CEA India · Ember · Google Travel Impact Model · OpenRouteService</p>
      </section>

      {/* Form panel */}
      <section className="relative flex min-h-dvh flex-col lg:bg-surface">
        {/* Phone/tablet brand header */}
        <div className="relative overflow-hidden bg-[radial-gradient(120%_120%_at_0%_0%,#26634d_0%,#10261f_70%)] px-5 pb-14 pt-6 text-white lg:hidden">
          <Leaves className="opacity-50" />
          <div className="relative"><BrandMark light /></div>
          <h1 className="relative mt-5 font-display text-3xl font-semibold leading-tight tracking-tight">
            Know the carbon <span className="text-sprout">before</span> you choose.
          </h1>
          <p className="relative mt-2 text-sm text-white/70">Predict, compare and cut the footprint of everyday decisions.</p>
        </div>

        <div className="flex flex-1 items-start justify-center px-4 lg:items-center lg:px-10">
          <div className="animate-rise -mt-8 w-full max-w-md rounded-3xl border border-line bg-surface-strong p-6 shadow-xl sm:p-8 lg:mt-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <div className="flex rounded-2xl bg-sage/70 p-1" role="tablist" aria-label="Account">
              <Link href="/login" replace role="tab" aria-selected={!isSignup} className={tab(!isSignup)}>Sign in</Link>
              <Link href="/signup" replace role="tab" aria-selected={isSignup} className={tab(isSignup)}>Create account</Link>
            </div>

            <h2 className="mt-7 font-display text-3xl font-semibold tracking-tight text-forest">
              {isSignup ? "Start shifting" : "Welcome back"}
            </h2>
            <p className="mt-1.5 text-sm text-ink/60">
              {isSignup
                ? "Save predictions, choices and your carbon goal, synced across devices."
                : "Sign in to pick up your saved decisions and goals."}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-ink/80">
                Email
                <span className="relative mt-1.5 block">
                  <Icon name="mail" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                  <input
                    className="field py-3 pl-10"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </span>
              </label>

              <label className="block text-sm font-medium text-ink/80">
                <span className="flex items-center justify-between">
                  Password
                  {!isSignup && (
                    <button type="button" onClick={resetPassword} disabled={busy} className="text-xs font-medium text-moss hover:underline disabled:opacity-60">
                      Forgot password?
                    </button>
                  )}
                </span>
                <span className="relative mt-1.5 block">
                  <Icon name="lock" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                  <input
                    className="field py-3 pl-10 pr-12"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    placeholder={isSignup ? "At least 8 characters" : "Your password"}
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink/55 hover:bg-sage hover:text-ink"
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

              {isSignup && password && (
                <div aria-live="polite">
                  <div className="flex gap-1.5" aria-hidden>
                    {[1, 2, 3, 4].map((n) => (
                      <span key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= score ? STRENGTH_COLOR[score] : "bg-line"}`} />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-ink/55">Password strength: <span className="font-medium text-ink/80">{STRENGTH_LABEL[score]}</span></p>
                </div>
              )}

              {error && (
                <p role="alert" className="rounded-xl border border-clay/30 bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>
              )}
              {message && (
                <p role="status" className="flex items-start gap-2 rounded-xl border border-fern/30 bg-fern/10 px-3 py-2 text-sm text-moss">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0" />{message}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-forest/20 transition hover:-translate-y-0.5 hover:bg-moss disabled:translate-y-0 disabled:opacity-60"
              >
                {busy ? <><Spinner /> Please wait…</> : (
                  <>
                    {isSignup ? "Create account" : "Sign in"}
                    <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink/60">
              {isSignup ? "Already have an account? " : "New to CarbonShift? "}
              <Link className="font-semibold text-moss hover:underline" href={isSignup ? "/login" : "/signup"} replace>
                {isSignup ? "Sign in" : "Create a free account"}
              </Link>
            </p>
            <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-ink/45">
              <Icon name="shield" className="h-3.5 w-3.5" /> Your history syncs privately to your own account.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
