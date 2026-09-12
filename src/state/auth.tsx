import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { isDemo, requireSupabase, supabase } from "../lib/supabase";
import { demoDeleteAccount, demoSession, demoSignIn, demoSignOut } from "../lib/demo";
import { clearPin } from "../lib/pin";

interface AuthValue {
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => (isDemo ? demoSession() : null));
  const [loading, setLoading] = useState(!isDemo && Boolean(supabase));

  useEffect(() => {
    if (isDemo || !supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      loading,
      async signUp(email, password) {
        if (isDemo) {
          setSession(demoSignIn(email));
          return { needsConfirmation: false };
        }
        const { data, error } = await requireSupabase().auth.signUp({ email, password });
        if (error) throw error;
        return { needsConfirmation: !data.session };
      },
      async signIn(email, password) {
        if (isDemo) {
          setSession(demoSignIn(email));
          return;
        }
        const { error } = await requireSupabase().auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      // Sair apaga o PIN do aparelho: é assim que um adulto que esqueceu o PIN recupera o acesso.
      async signOut() {
        const guardianId = session?.user.id;
        if (isDemo) {
          demoSignOut();
          setSession(null);
        } else {
          await requireSupabase().auth.signOut();
        }
        if (guardianId) clearPin(guardianId);
      },
      async deleteAccount() {
        const guardianId = session?.user.id;
        if (isDemo) {
          demoDeleteAccount();
          setSession(null);
        } else {
          const client = requireSupabase();
          const { error } = await client.rpc("delete_my_account");
          if (error) throw error;
          await client.auth.signOut();
        }
        if (guardianId) clearPin(guardianId);
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro do AuthProvider");
  return ctx;
}
