import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { isDemo, requireSupabase, supabase } from "../lib/supabase";
import { demoDeleteAccount, demoSession, demoSignIn, demoSignOut, demoStart } from "../lib/demo";
import type { AccountKind } from "../lib/account";
import { metaFromSession } from "../lib/account";
import { clearAccountDeviceData } from "../lib/cache";

export interface SignUpInput {
  email: string;
  password: string;
}

interface AuthValue {
  session: Session | null;
  loading: boolean;
  /** A sessão não pôde ser verificada (rede, storage bloqueado): a interface mostra saída clara em vez de splash eterno. */
  authError: boolean;
  /**
   * Verdadeiro entre a validação do código de recuperação e a gravação da senha nova.
   * Nesse intervalo a sessão existe, mas a área autenticada NÃO pode abrir (UX-01):
   * App.tsx usa `authenticatedAreaBlocked` e o AuthFlow começa na tela "Nova senha".
   */
  needsPasswordChange: boolean;
  signUp: (input: SignUpInput) => Promise<{ needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  enterDemo: (kind: AccountKind) => void;
  /** Reenvio do e-mail de confirmação de cadastro (a etapa "Confirme o e-mail"). */
  resendSignUp: (email: string) => Promise<void>;
  requestPasswordCode: (email: string) => Promise<void>;
  verifyPasswordCode: (email: string, token: string) => Promise<void>;
  /** Grava a senha nova durante a recuperação; só depois dela a área autenticada libera. */
  finishPasswordRecovery: (password: string) => Promise<void>;
  /** Desiste da recuperação: sai da conta e limpa o estado, sem abrir a área autenticada. */
  cancelPasswordRecovery: () => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/**
 * Chave em sessionStorage: o gate sobrevive a um recarregamento na mesma aba,
 * mas não vaza para outras abas nem para outra sessão do navegador.
 */
export const PASSWORD_RECOVERY_KEY = "baseline.pwRecovery";

/** Lê o gate persistido (verdadeiro entre o código validado e a senha nova gravada). */
export function readRecoveryFlag(): boolean {
  try {
    return globalThis.sessionStorage?.getItem(PASSWORD_RECOVERY_KEY) === "1";
  } catch {
    return false;
  }
}

/** Sobe/derruba o gate persistido. */
export function writeRecoveryFlag(on: boolean): void {
  try {
    const store = globalThis.sessionStorage;
    if (!store) return;
    if (on) store.setItem(PASSWORD_RECOVERY_KEY, "1");
    else store.removeItem(PASSWORD_RECOVERY_KEY);
  } catch {
    // Storage cheio ou bloqueado: o gate vale só na memória desta execução.
  }
}

/** Contrato com App.tsx: com sessão e troca de senha pendente, renderize o AuthFlow, não a área autenticada. */
export function authenticatedAreaBlocked(hasSession: boolean, needsPasswordChange: boolean): boolean {
  return hasSession && needsPasswordChange;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => (isDemo ? demoSession() : null));
  const [loading, setLoading] = useState(!isDemo && Boolean(supabase));
  const [authError, setAuthError] = useState(false);
  // Restaura o gate se o app recarregou no meio da troca de senha.
  const [needsPasswordChange, setNeedsPasswordChange] = useState(readRecoveryFlag);
  const currentAccount = useRef<string | null>(session?.user.id ?? null);

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
        currentAccount.current = data.session?.user.id ?? null;
        setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        if (stale) return;
        window.clearTimeout(timeout);
        setAuthError(true);
        setLoading(false);
      });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "SIGNED_OUT" && currentAccount.current) clearAccountDeviceData(currentAccount.current);
      currentAccount.current = next?.user.id ?? null;
      setSession(next);
    });
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
      needsPasswordChange,
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
      async resendSignUp(email) {
        if (isDemo) return;
        const { error } = await requireSupabase().auth.resend({ type: "signup", email });
        if (error) throw error;
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
        // O gate sobe ANTES do verifyOtp: o SIGNED_IN emitido pelo Supabase no meio da chamada
        // não pode fazer o App abrir a área autenticada sem a senha nova (UX-01).
        writeRecoveryFlag(true);
        setNeedsPasswordChange(true);
        try {
          const { error } = await requireSupabase().auth.verifyOtp({ email, token, type: "email" });
          if (error) throw error;
        } catch (error) {
          const current = await requireSupabase().auth.getSession().catch(() => ({ data: { session: null } }));
          if (!current.data.session) { writeRecoveryFlag(false); setNeedsPasswordChange(false); }
          throw error;
        }
      },
      async finishPasswordRecovery(password) {
        if (isDemo) {
          writeRecoveryFlag(false);
          setNeedsPasswordChange(false);
          return;
        }
        const client = requireSupabase();
        const { error } = await client.auth.updateUser({ password });
        if (error) throw error;
        // Renova o token antes de liberar a área autenticada, para a sessão refletir a conta atualizada.
        await client.auth.refreshSession().catch(() => undefined);
        writeRecoveryFlag(false);
        setNeedsPasswordChange(false);
      },
      async cancelPasswordRecovery() {
        if (isDemo) {
          demoSignOut();
          setSession(null);
        } else {
          // Sai primeiro: se o signOut falhar, o gate continua de pé e a pessoa tenta de novo.
          const { error } = await requireSupabase().auth.signOut();
          if (error) throw error;
          setSession(null);
        }
        if (session) clearAccountDeviceData(session.user.id);
        writeRecoveryFlag(false);
        setNeedsPasswordChange(false);
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
        if (session) clearAccountDeviceData(session.user.id);
        writeRecoveryFlag(false);
        setNeedsPasswordChange(false);
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
        if (session) {
          clearAccountDeviceData(session.user.id);
          try { localStorage.removeItem(`baseline.queue.${session.user.id}`); localStorage.removeItem("baseline.resume"); } catch { /* storage indisponível */ }
        }
      },
    }),
    [session, loading, authError, needsPasswordChange],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro do AuthProvider");
  return ctx;
}
