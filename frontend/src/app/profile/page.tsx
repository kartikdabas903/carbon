"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { useHistory } from "@/lib/history";
import { getAccountGoal, type AccountGoal } from "@/lib/account";
import { supabase } from "@/lib/supabase";
import { fmtKg } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { user, configured, ready, cloudError } = useAuth();
  const history = useHistory();
  const [goalState, setGoalState] = useState<{ userId: string; goal: AccountGoal | null } | null>(null);
  const [goalError, setGoalError] = useState("");
  const [signOutError, setSignOutError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void getAccountGoal().then((savedGoal) => {
      if (active) setGoalState({ userId: user.id, goal: savedGoal });
    }).catch((error: Error) => {
      if (active) setGoalError(error.message);
    });
    return () => { active = false; };
  }, [user]);

  const goal = user && goalState?.userId === user.id ? goalState.goal : null;

  async function signOut() {
    if (!supabase) return;
    setSigningOut(true);
    setSignOutError("");
    const { error } = await supabase.auth.signOut();
    if (error) {
      setSignOutError(error.message);
      setSigningOut(false);
      return;
    }
    router.replace("/login");
  }

  const predictions = history?.filter((entry) => entry.kind !== "calculation") ?? [];
  const chosenCount = predictions.filter((entry) => entry.choice).length;
  const totalPredictedKg = predictions.reduce((sum, entry) => sum + entry.prediction.predictedKg, 0);

  if (!ready) return <p className="text-sm text-ink/60" role="status">Loading your profile…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow="Account" icon="history" title="Your profile" description="Your account, saved decisions, chosen changes, and carbon goal." />

      {!configured ? (
        <Card title="Cloud accounts unavailable">
          <p className="text-sm text-ink/70">Add the Supabase URL and publishable key to `frontend/.env.local`, and the service-role key to `backend/.env`.</p>
        </Card>
      ) : !user ? (
        <Card title="Sign in to view your profile">
          <p className="text-sm text-ink/70">Your predictions and goals sync to your account after sign-in.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-moss">Sign in</Link>
            <Link href="/signup" className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-paper">Create account</Link>
          </div>
        </Card>
      ) : (
        <>
          <Card title="Account details">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-ink/55">Signed in as</dt>
                <dd className="mt-1 break-all text-sm font-medium">{user.email ?? "Email unavailable"}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink/55">Cloud sync</dt>
                <dd className="mt-1 text-sm font-medium text-moss">Connected to your account</dd>
              </div>
            </dl>
            {(cloudError || goalError) && <p role="status" className="mt-3 text-sm text-clay">{cloudError || goalError}</p>}
          </Card>

          <Card title="Your saved data">
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-ink/55">Predictions</dt>
                <dd className="mt-1 font-display text-2xl font-semibold text-forest">{predictions.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink/55">Predicted total</dt>
                <dd className="mt-1 font-display text-2xl font-semibold text-forest">{fmtKg(totalPredictedKg)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink/55">Chosen changes</dt>
                <dd className="mt-1 font-display text-2xl font-semibold text-forest">{chosenCount}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-ink/55">Predictions include their recommendations. Only the latest 50 are synced to your account. Full chat transcripts are not stored.</p>
          </Card>

          <Card title="Approved carbon goal">
            {goal ? (
              <p className="text-sm text-ink/75">Reduce your predicted emissions by <strong>{goal.reductionPct}%</strong> by <strong>{goal.targetYear}</strong>.</p>
            ) : (
              <p className="text-sm text-ink/60">No goal saved yet. Change the target controls on the <Link href="/net-zero" className="text-moss underline">Net-zero plan</Link> to save one.</p>
            )}
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            {signOutError && <p role="alert" className="text-sm text-clay">{signOutError}</p>}
            <button type="button" onClick={() => void signOut()} disabled={signingOut} className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink hover:border-clay/50 hover:text-clay disabled:opacity-60">
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}