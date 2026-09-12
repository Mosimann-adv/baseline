import { useState, type FormEvent } from "react";
import { useAuth } from "../state/auth";
import { friendlyError } from "../lib/errors";
import { LEGAL_DOCS, type LegalId } from "../content/legal";
import { LegalScreen } from "./LegalScreen";
import { Field, Group, Notice, PlainButton, PrimaryButton, Screen, SwitchRow } from "../components/ui";

type Mode = "welcome" | "signin" | "signup";

export function AuthFlow() {
  const [mode, setMode] = useState<Mode>("welcome");
  const [doc, setDoc] = useState<LegalId | null>(null);
  if (mode === "signin") return <SignIn onBack={() => setMode("welcome")} onSwitch={() => setMode("signup")} />;
  if (mode === "signup") return <SignUp onBack={() => setMode("welcome")} onSwitch={() => setMode("signin")} />;
  if (doc) return <LegalScreen doc={LEGAL_DOCS[doc]} onBack={() => setDoc(null)} />;
  return <Welcome onSignIn={() => setMode("signin")} onSignUp={() => setMode("signup")} onDoc={setDoc} />;
}

function Welcome({ onSignIn, onSignUp, onDoc }: { onSignIn: () => void; onSignUp: () => void; onDoc: (doc: LegalId) => void }) {
  return (
    <main className="welcome">
      <img src="icons/icon-192.png" alt="" width={88} height={88} className="welcome-icon" />
      <h1 className="large-title">Baseline</h1>
      <p className="welcome-sub">Treinos de basquete para crianças e adolescentes, com o acompanhamento de quem cuida delas.</p>
      <div className="welcome-actions">
        <PrimaryButton onClick={onSignUp}>Criar conta de responsável</PrimaryButton>
        <PlainButton onClick={onSignIn}>Já tenho conta</PlainButton>
      </div>
      <p className="fine">A conta é sempre de um adulto. Cada atleta treina pelo perfil que você criar.</p>
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

function SignIn({ onBack, onSwitch }: { onBack: () => void; onSwitch: () => void }) {
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
        <PlainButton onClick={onSwitch}>Criar conta de responsável</PlainButton>
      </form>
    </Screen>
  );
}

function SignUp({ onBack, onSwitch }: { onBack: () => void; onSwitch: () => void }) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isGuardian, setIsGuardian] = useState(false);
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // O texto abre por cima do formulário sem desmontá-lo: o que já foi digitado continua lá na volta.
  const [reading, setReading] = useState<LegalId | null>(null);

  const ready = email.includes("@") && password.length >= 8 && isGuardian && acceptsTerms;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const { needsConfirmation } = await signUp(email.trim(), password);
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
    <Screen eyebrow="Conta de responsável" title="Criar conta" onBack={onBack}>
      <form onSubmit={submit} className="stack">
        <Group footer="A senha precisa ter pelo menos 8 caracteres.">
          <Field id="signup-email" label="E-mail" type="email" inputMode="email" autoComplete="email" value={email} onChange={setEmail} placeholder="voce@exemplo.com" />
          <Field id="signup-password" label="Senha" type="password" autoComplete="new-password" value={password} onChange={setPassword} />
        </Group>
        <Group
          header="Declarações"
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
              . Textos em revisão antes do lançamento.
            </>
          }
        >
          <SwitchRow
            id="signup-guardian"
            label="Sou maior de 18 anos e responsável legal pelos atletas que vou cadastrar"
            checked={isGuardian}
            onChange={setIsGuardian}
          />
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
