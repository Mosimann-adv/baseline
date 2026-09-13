import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { isDemo, requireSupabase, supabase } from "../lib/supabase";
import { demoDeleteAccount, demoSession, demoSignIn, demoSignOut, demoStart } from "../lib/demo";
import type { AccountKind } from "../lib/account";
import { metaFromSession } from "../lib/account";

export interface SignUpInput {
  email: string;
  password: string;
  birthYear: number;
  kind: AccountKind;
  parentEmail?: string;
}

interface AuthValue {
  session: Session | null;
  loading: boolean;
  signUp: (input: SignUpInput) => Promise<{ needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  enterDemo: (kind: AccountKind) => void;
  requestPasswordCode: (email: string) => Promise<void>;
  verifyPasswordCode: (email: string, token: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
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
      async signUp(input) {
        if (isDemo) {
          setSession(demoSignIn(input.email, { birthYear: input.birthYear, parentEmail: input.parentEmail, kind: input.kind }));
          return { needsConfirmation: false };
        }
        const { data, error } = await requireSupabase().auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            data: {
              birth_year: input.birthYear,
              parent_email: input.parentEmail ?? null,
              account_kind: input.kind,
            },
          },
        });
        if (error) throw error;
        return { needsConfirmation: !data.session };
      },
      async signIn(email, password) {
        if (isDemo) {
          const current = demoSession();
          const meta = metaFromSession(current);
          setSession(demoSignIn(email, { birthYear: meta.birthYear ?? undefined, parentEmail: meta.parentEmail ?? undefined, kind: meta.kind }));
          return;
        }
        const { error } = await requireSupabase().auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      enterDemo(kind) {
        if (!isDemo) return;
        setSession(demoStart(kind));
      },
      async requestPasswordCode(email) {
        if (isDemo) return;
        const { error } = await requireSupabase().auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
        if (error) throw error;
      },
      async verifyPasswordCode(email, token) {
        if (isDemo) throw new Error("No modo demonstração não há recuperação de senha.");
        const { error } = await requireSupabase().auth.verifyOtp({ email, token, type: "email" });
        if (error) throw error;
      },
      async updatePassword(password) {
        if (isDemo) return;
        const { error } = await requireSupabase().auth.updateUser({ password });
        if (error) throw error;
      },
      async signOut() {
        if (isDemo) {
          demoSignOut();
          setSession(null);
        } else {
          await requireSupabase().auth.signOut();
        }
      },
      async deleteAccount(password: string) {
        if (isDemo) {
          demoDeleteAccount();
          setSession(null);
        } else {
          const client = requireSupabase();
          const email = session?.user.email;
          if (!email) throw new Error("Entre de novo para excluir a conta.");
          const { error: authError } = await client.auth.signInWithPassword({ email, password });
          if (authError) throw authError;
          const { error } = await client.rpc("delete_my_account");
          if (error) throw error;
          await client.auth.signOut();
        }
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
