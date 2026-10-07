"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getAccountHistory } from "@/lib/account";
import { mergeHistory, setHistoryUser } from "@/lib/history";
import { setBudgetUser } from "@/lib/budget";
import { supabase } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  ready: boolean;
  configured: boolean;
  cloudError: string;
}

const AuthContext = createContext<AuthState>({ user: null, ready: true, configured: false, cloudError: "" });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, ready: !supabase, configured: !!supabase, cloudError: "" });
  const activeUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!supabase) {
      setHistoryUser(null);
      setBudgetUser(null);
      return;
    }

    let alive = true;
    const activate = async (session: Session | null) => {
      if (!alive) return;
      const user = session?.user ?? null;
      const userId = user?.id ?? null;
      setState((current) => ({ ...current, user, ready: false, cloudError: "" }));
      if (activeUserId.current === userId) {
        setState((current) => ({ ...current, ready: true }));
        return;
      }
      activeUserId.current = userId;
      setHistoryUser(userId);
      setBudgetUser(userId);
      if (!session) {
        setState((current) => ({ ...current, ready: true }));
        return;
      }

      setState((current) => ({ ...current, ready: false }));
      try {
        const entries = await getAccountHistory(session.access_token);
        if (alive) mergeHistory(entries);
      } catch (error) {
        if (alive) setState((current) => ({ ...current, cloudError: (error as Error).message }));
      } finally {
        if (alive) setState((current) => ({ ...current, ready: true }));
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => { void activate(session); }, 0);
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) setState((current) => ({ ...current, cloudError: error.message }));
      void activate(data.session);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={state}>
      {state.ready ? children : <div className="grid min-h-screen place-items-center text-sm text-ink/60" role="status">Loading your account…</div>}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}