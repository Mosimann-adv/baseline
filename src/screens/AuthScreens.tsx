import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../state/auth";
import { friendlyError } from "../lib/errors";
import { isDemo } from "../lib/supabase";
import { LEGAL_DOCS, type LegalId } from "../content/legal";
import { LegalScreen } from "./LegalScreen";
import { Explore } from "./Explore";
import { Field, Group, Notice, PlainButton, PrimaryButton, Screen, SwitchRow } from "../components/ui";

// Reenvio de e-mails (código de recuperação e confirmação de cadastro): cooldown persistente
// para não esbarrar no limite de envio do Supabase. Uma chave por tipo de e-mail.
const OTP_SENT_KEY = "baseline.otp.sentAt";
const SIGNUP_SENT_KEY = "baseline.signup.sentAt";
export const SEND_COOLDOWN_S = 60;

function readSentAt(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    const value = raw ? Number(raw) : NaN;
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function markSentAt(key: string, now: number): void {
  try {
    localStorage.setItem(key, String(now));
  } catch {
    // Sem armazenamento: o cooldown vale só nesta tela.
  }
}

/** Segundos que ainda faltam de cooldown; 0 quando pode enviar de novo. */
export function cooldownRemaining(sentAt: number | null, now: number, cooldownS = SEND_COOLDOWN_S): number {
  if (sentAt === null) return 0;
  return Math.max(0, cooldownS - Math.floor((now - sentAt) / 1000));
}

type Mode = "welcome" | "explore" | "signin" | "signup" | "forgot" | "code" | "newpass";

export function AuthFlow() {
  const { needsPasswordChange, session } = useAuth();
  // Recuperação de senha pendente (UX-01): o AuthFlow abre já na tela "Nova senha",
  // porque a sessão existe mas a área autenticada continua fechada até a senha nova.
  const [mode, setMode] = useState<Mode>(() => (needsPasswordChange && session ? "newpass" : "welcome"));
  const [doc, setDoc] = useState<LegalId | null>(null);
  const [recoverEmail, setRecoverEmail] = useState("");
  // Rede de segurança: se o gate subir com o AuthFlow já montado em outra tela, ele vira "Nova senha".
  useEffect(() => {
    if (needsPasswordChange && session) setMode((current) => (current === "newpass" ? current : "newpass"));
    else if (!needsPasswordChange && !session && mode === "newpass") setMode("welcome");
  }, [needsPasswordChange, session, mode]);
  if (mode === "explore") {
    return <Explore onExit={() => setMode("welcome")} onSignUp={() => setMode("signup")} />;
  }
  if (mode === "signin") {
    return (
      <SignIn
        onBack={() => setMode("welcome")}
        onSwitch={() => setMode("signup")}
        onForgot={() => setMode("forgot")}
      />
    );
  }
  if (mode === "signup") return <SignUp onBack={() => setMode("welcome")} onSwitch={() => setMode("signin")} />;
  if (mode === "forgot") {
    return (
      <ForgotPassword
        onBack={() => setMode("signin")}
        onSent={(email) => {
          markSentAt(OTP_SENT_KEY, Date.now());
          setRecoverEmail(email);
          setMode("code");
        }}
      />
    );
  }
  if (mode === "code") {
    return (
      <EnterCode
        email={recoverEmail}
        onBack={() => setMode("forgot")}
        onVerified={() => setMode("newpass")}
      />
    );
  }
  if (mode === "newpass") return <NewPassword onBack={() => setMode("signin")} />;
  if (doc) return <LegalScreen doc={LEGAL_DOCS[doc]} onBack={() => setDoc(null)} />;
  return (
    <Welcome
      onSignIn={() => setMode("signin")}
      onSignUp={() => setMode("signup")}
      onExplore={() => setMode("explore")}
      onDoc={setDoc}
    />
  );
}

function Welcome({ onSignIn, onSignUp, onExplore, onDoc }: { onSignIn: () => void; onSignUp: () => void; onExplore: () => void; onDoc: (doc: LegalId) => void }) {
  const { enterDemo } = useAuth();
  return (
    <main className="welcome">
      <img src="icons/icon-192.png" alt="" width={88} height={88} className="welcome-icon" />
      <h1 className="large-title">Baseline</h1>
      <p className="welcome-sub">Treinos de basquete guiados, com <em>vídeo</em>, para você e para as crianças e adolescentes que você acompanha.</p>
      <img className="welcome-hero" src="hero.webp" alt="Atletas do Arvoredo Basquetebol em quadra" loading="lazy" />
      <div className="welcome-actions">
        {isDemo && <PrimaryButton onClick={() => enterDemo("adult")}>Explorar</PrimaryButton>}
        <button type="button" className="secondary-button" onClick={onExplore}>
          Conhecer os treinos
        </button>
        {isDemo ? <PlainButton onClick={onSignUp}>Criar conta vazia</PlainButton> : <PrimaryButton onClick={onSignUp}>Criar conta</PrimaryButton>}
        <PlainButton onClick={onSignIn}>Já tenho conta</PlainButton>
      </div>
      <p className="fine">A conta é a partir de 16 anos. Quem tem menos de 16 treina pelo perfil criado pelo responsável.</p>
      <p className="fine legal-links">
        <button type="button" className="inline-link" onClick={() => onDoc("privacidade")}>
          Política de privacidade
        </button>
        <button type="button" className="inline-link" onClick={() => onDoc("termos")}>
          Termos de uso
        </button>
      </p>
    </main>
  );
}

function SignIn({ onBack, onSwitch, onForgot }: { onBack: () => void; onSwitch: () => void; onForgot: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <Screen title="Entrar" onBack={onBack}>
      <form onSubmit={submit} className="stack">
        <Group>
          <Field id="signin-email" label="E-mail" type="email" inputMode="email" autoComplete="email" value={email} onChange={setEmail} placeholder="voce@exemplo.com" />
          <Field id="signin-password" label="Senha" type="password" autoComplete="current-password" value={password} onChange={setPassword} />
        </Group>
        {error && <Notice tone="error">{error}</Notice>}
        <PrimaryButton type="submit" disabled={busy || !email || !password}>
          {busy ? "Entrando…" : "Entrar"}
        </PrimaryButton>
        {!isDemo && <PlainButton onClick={onForgot}>Esqueci a senha</PlainButton>}
        <PlainButton onClick={onSwitch}>Criar conta</PlainButton>
      </form>
    </Screen>
  );
}

function ForgotPassword({ onBack, onSent }: { onBack: () => void; onSent: (email: string) => void }) {
  const { requestPasswordCode } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await requestPasswordCode(email.trim());
      onSent(email.trim());
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <Screen title="Esqueci a senha" onBack={onBack}>
      <form onSubmit={submit} className="stack">
        <Group footer="Enviamos um código de 6 dígitos para o e-mail da conta. Não é um link: você digita o código aqui.">
          <Field id="recover-email" label="E-mail" type="email" inputMode="email" autoComplete="email" value={email} onChange={setEmail} placeholder="voce@exemplo.com" />
        </Group>
        {error && <Notice tone="error">{error}</Notice>}
        <PrimaryButton type="submit" disabled={busy || !email.includes("@")}>
          {busy ? "Enviando…" : "Enviar código"}
        </PrimaryButton>
      </form>
    </Screen>
  );
}

function EnterCode({ email, onBack, onVerified }: { email: string; onBack: () => void; onVerified: () => void }) {
  const { verifyPasswordCode, requestPasswordCode } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(() => readSentAt(OTP_SENT_KEY));
  const [now, setNow] = useState(() => Date.now());
  const remaining = cooldownRemaining(sentAt, now);

  // Chegou aqui pelo envio da tela anterior: garante o cooldown mesmo recarregando a página.
  useEffect(() => {
    if (readSentAt(OTP_SENT_KEY) === null) {
      const at = Date.now();
      markSentAt(OTP_SENT_KEY, at);
      setSentAt(at);
    }
  }, []);

  // Conta regressiva do cooldown, um segundo por vez.
  useEffect(() => {
    if (remaining <= 0) return;
    const id = window.setTimeout(() => setNow(Date.now()), 1000);
    return () => window.clearTimeout(id);
  }, [remaining, sentAt]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await verifyPasswordCode(email, code.trim());
      onVerified();
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  async function resend() {
    if (resending || remaining > 0) return;
    setResending(true);
    setError(null);
    try {
      await requestPasswordCode(email.trim());
      const at = Date.now();
      markSentAt(OTP_SENT_KEY, at);
      setSentAt(at);
      setNow(at);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <Screen title="Código" onBack={onBack}>
      <form onSubmit={submit} className="stack">
        <Group footer={`Enviado para ${email}. O código vale por alguns minutos.`}>
          <Field id="otp-code" label="Código" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={setCode} maxLength={8} placeholder="000000" />
        </Group>
        {error && <Notice tone="error">{error}</Notice>}
        <PrimaryButton type="submit" disabled={busy || code.trim().length < 6}>
          {busy ? "Conferindo…" : "Continuar"}
        </PrimaryButton>
        {!isDemo && (
          <PlainButton onClick={() => void resend()} disabled={busy || resending || remaining > 0 || !email.includes("@")}>
            {resending ? "Enviando…" : remaining > 0 ? `Reenviar em ${remaining}s` : "Reenviar código"}
          </PlainButton>
        )}
      </form>
    </Screen>
  );
}

function NewPassword({ onBack }: { onBack: () => void }) {
  const { updatePassword, finishPasswordRecovery, cancelPasswordRecovery, needsPasswordChange } = useAuth();
  // Durante a recuperação (UX-01), há sessão aberta mas a senha ainda é a antiga:
  // o back vira "cancelar e sair" e a gravação usa finishPasswordRecovery, que libera o gate.
  const inRecovery = needsPasswordChange;
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (inRecovery) await finishPasswordRecovery(password);
      else await updatePassword(password);
      setDone(true);
    } catch (err) {
      // Falhou (rede, senha igual, regra do servidor): o gate continua de pé e a tela permanece.
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  async function cancel() {
    if (busy) return;
    setBusy(true); setError(null);
    try { await cancelPasswordRecovery(); onBack(); }
    catch (err) { setError(friendlyError(err)); setBusy(false); }
  }

  if (done) {
    return (
      <Screen title="Senha nova" onBack={inRecovery ? cancel : onBack}>
        <div className="stack">
          <Notice tone="success">Senha atualizada. Você já está na conta.</Notice>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="Nova senha" onBack={inRecovery ? cancel : onBack}>
      <form onSubmit={submit} className="stack">
        {inRecovery && (
          <Notice>Para proteger a conta, defina uma senha nova antes de continuar. Em vez disso, cancele e saia pelo botão Voltar.</Notice>
        )}
        <Group footer="A senha precisa ter pelo menos 8 caracteres.">
          <Field id="new-password" label="Nova senha" type="password" autoComplete="new-password" value={password} onChange={setPassword} />
        </Group>
        {error && <Notice tone="error">{error}</Notice>}
        <PrimaryButton type="submit" disabled={busy || password.length < 8}>
          {busy ? "Salvando…" : "Salvar senha"}
        </PrimaryButton>
        {inRecovery && <PlainButton onClick={() => void cancel()} disabled={busy}>Cancelar e sair da conta</PlainButton>}
      </form>
    </Screen>
  );
}

function SignUp({ onBack, onSwitch }: { onBack: () => void; onSwitch: () => void }) {
  const { signUp, resendSignUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isOldEnough, setIsOldEnough] = useState(false);
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(() => readSentAt(SIGNUP_SENT_KEY));
  const [now, setNow] = useState(() => Date.now());
  const [reading, setReading] = useState<LegalId | null>(null);
  const remaining = cooldownRemaining(sentAt, now);

  // Conta regressiva do cooldown do reenvio.
  useEffect(() => {
    if (remaining <= 0) return;
    const id = window.setTimeout(() => setNow(Date.now()), 1000);
    return () => window.clearTimeout(id);
  }, [remaining, sentAt]);

  const ready = email.includes("@") && password.length >= 8 && isOldEnough && acceptsTerms;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const { needsConfirmation } = await signUp({ email: email.trim(), password });
      if (needsConfirmation) {
        const at = Date.now();
        markSentAt(SIGNUP_SENT_KEY, at);
        setSentAt(at);
        setNow(at);
        setSentTo(email.trim());
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!sentTo || resending || remaining > 0) return;
    setResending(true);
    setError(null);
    try {
      await resendSignUp(sentTo);
      const at = Date.now();
      markSentAt(SIGNUP_SENT_KEY, at);
      setSentAt(at);
      setNow(at);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setResending(false);
    }
  }

  if (reading) return <LegalScreen doc={LEGAL_DOCS[reading]} onBack={() => setReading(null)} />;

  if (sentTo) {
    return (
      <Screen title="Confirme o e-mail" onBack={onBack}>
        <div className="stack">
          <Notice tone="success">Enviamos um link para {sentTo}. Toque nele para confirmar a conta e depois entre com seu e-mail e senha.</Notice>
          {error && <Notice tone="error">{error}</Notice>}
          <Group footer="Não chegou nada? Veja o spam ou corrija o e-mail digitado abaixo.">
            <button
              type="button"
              className="row row-action"
              onClick={() => void resend()}
              disabled={resending || remaining > 0}
            >
              {resending ? "Enviando…" : remaining > 0 ? `Reenviar em ${remaining}s` : "Reenviar confirmação"}
            </button>
            <button type="button" className="row row-action" onClick={() => setSentTo(null)}>
              Corrigir e-mail
            </button>
          </Group>
          <PrimaryButton onClick={onSwitch}>Já confirmei, entrar</PrimaryButton>
        </div>
      </Screen>
    );
  }

  return (
    <Screen eyebrow="Sua conta" title="Criar conta" onBack={onBack}>
      <form onSubmit={submit} className="stack">
        <Group footer="A senha precisa ter pelo menos 8 caracteres.">
          <Field id="signup-email" label="E-mail" type="email" inputMode="email" autoComplete="email" value={email} onChange={setEmail} placeholder="voce@exemplo.com" />
          <Field id="signup-password" label="Senha" type="password" autoComplete="new-password" value={password} onChange={setPassword} />
        </Group>

        <Group
          footer={
            <>
              Leia antes de aceitar:{" "}
              <button type="button" className="inline-link" onClick={() => setReading("termos")}>
                Termos de uso
              </button>{" "}
              e{" "}
              <button type="button" className="inline-link" onClick={() => setReading("privacidade")}>
                Política de privacidade
              </button>
              .
            </>
          }
        >
          <SwitchRow id="signup-age" label="Tenho 16 anos ou mais" checked={isOldEnough} onChange={setIsOldEnough} />
          <SwitchRow id="signup-terms" label="Li e aceito os Termos de uso e a Política de privacidade" checked={acceptsTerms} onChange={setAcceptsTerms} />
        </Group>
        {error && <Notice tone="error">{error}</Notice>}
        <PrimaryButton type="submit" disabled={!ready || busy}>
          {busy ? "Criando conta…" : "Criar conta"}
        </PrimaryButton>
        <PlainButton onClick={onSwitch}>Já tenho conta</PlainButton>
      </form>
    </Screen>
  );
}
