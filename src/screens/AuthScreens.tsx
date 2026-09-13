import { useState, type FormEvent } from "react";
import { useAuth } from "../state/auth";
import { friendlyError } from "../lib/errors";
import { isDemo } from "../lib/supabase";
import { LEGAL_DOCS, type LegalId } from "../content/legal";
import { LegalScreen } from "./LegalScreen";
import { Field, Group, Notice, PlainButton, PrimaryButton, Screen, SwitchRow } from "../components/ui";

type Mode = "welcome" | "signin" | "signup" | "forgot" | "code" | "newpass";

export function AuthFlow() {
  const [mode, setMode] = useState<Mode>("welcome");
  const [doc, setDoc] = useState<LegalId | null>(null);
  const [recoverEmail, setRecoverEmail] = useState("");
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
  return <Welcome onSignIn={() => setMode("signin")} onSignUp={() => setMode("signup")} onDoc={setDoc} />;
}

function Welcome({ onSignIn, onSignUp, onDoc }: { onSignIn: () => void; onSignUp: () => void; onDoc: (doc: LegalId) => void }) {
  const { enterDemo } = useAuth();
  return (
    <main className="welcome">
      <img src="icons/icon-192.png" alt="" width={88} height={88} className="welcome-icon" />
      <h1 className="large-title">Baseline</h1>
      <p className="welcome-sub">Treinos de basquete guiados, com vídeo, para você e para as crianças e adolescentes que você acompanha.</p>
      <div className="welcome-actions">
        {isDemo && <PrimaryButton onClick={() => enterDemo("adult")}>Explorar</PrimaryButton>}
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
  const { verifyPasswordCode } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      </form>
    </Screen>
  );
}

function NewPassword({ onBack }: { onBack: () => void }) {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Screen title="Senha nova" onBack={onBack}>
        <div className="stack">
          <Notice tone="success">Senha atualizada. Você já está na conta.</Notice>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="Nova senha" onBack={onBack}>
      <form onSubmit={submit} className="stack">
        <Group footer="A senha precisa ter pelo menos 8 caracteres.">
          <Field id="new-password" label="Nova senha" type="password" autoComplete="new-password" value={password} onChange={setPassword} />
        </Group>
        {error && <Notice tone="error">{error}</Notice>}
        <PrimaryButton type="submit" disabled={busy || password.length < 8}>
          {busy ? "Salvando…" : "Salvar senha"}
        </PrimaryButton>
      </form>
    </Screen>
  );
}

function SignUp({ onBack, onSwitch }: { onBack: () => void; onSwitch: () => void }) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isOldEnough, setIsOldEnough] = useState(false);
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState<LegalId | null>(null);

  const ready = email.includes("@") && password.length >= 8 && isOldEnough && acceptsTerms;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const { needsConfirmation } = await signUp({ email: email.trim(), password });
      if (needsConfirmation) setSentTo(email.trim());
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (reading) return <LegalScreen doc={LEGAL_DOCS[reading]} onBack={() => setReading(null)} />;

  if (sentTo) {
    return (
      <Screen title="Confirme o e-mail" onBack={onBack}>
        <div className="stack">
          <Notice tone="success">Enviamos um link para {sentTo}. Toque nele para confirmar a conta e depois entre com seu e-mail e senha.</Notice>
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
