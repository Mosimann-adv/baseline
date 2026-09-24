import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { isDemo, requireSupabase, supabase } from "../lib/supabase";
import { demoDeleteAccount, demoSession, demoSignIn, demoSignOut, demoStart } from "../lib/demo";
import type { AccountKind } from "../lib/account";
import { metaFromSession } from "../lib/account";

export interface SignUpInput {
  email: string;
  password: string;
}

interface AuthValue {
  session: Session | null;
  loading: boolean;
  /** A sessão não pôde ser verificada (rede, storage bloqueado): a interface mostra saída clara em vez de splash eterno. */
  authError: boolean;
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
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    if (isDemo || !supabase) return;
    // Rede parada ou storage bloqueado não pode deixar o app no splash para sempre.
    let stale = false;
    const timeout = window.setTimeout(() => {
      stale = true;
      setAuthError(true);
      setLoading(false);
    }, 15000);
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (stale) return;
        window.clearTimeout(timeout);
        setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        if (stale) return;
        window.clearTimeout(timeout);
        setAuthError(true);
        setLoading(false);
      });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      window.clearTimeout(timeout);
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      loading,
      authError,
      async signUp(input) {
        if (isDemo) {
          setSession(demoSignIn(input.email, { kind: "adult" }));
          return { needsConfirmation: false };
        }
        const { data, error } = await requireSupabase().auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            data: {
              declared_16: true,
              account_kind: "adult",
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
          const { error } = await requireSupabase().auth.signOut();
          if (error) throw error;
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
    [session, loading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro do AuthProvider");
  return ctx;
}
