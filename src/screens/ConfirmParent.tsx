import { useState, type FormEvent } from "react";
import { Field, Group, Notice, PrimaryButton, Screen } from "../components/ui";
import { friendlyError } from "../lib/errors";
import { confirmParentCode } from "../lib/parentConfirm";

/** Página pública (#/confirmar-responsavel): o responsável confirma a conta de um adolescente 16–17. */
export function ConfirmParent({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const confirmed = await confirmParentCode(email, code);
      if (!confirmed) {
        setError("E-mail ou código não conferem. Peça o código atual no app, na tela Conta.");
        setBusy(false);
        return;
      }
      setOk(true);
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  if (ok) {
    return (
      <Screen title="Conta confirmada" onBack={onBack}>
        <div className="stack">
          <Notice tone="success">A conta do adolescente está liberada para treinar. Pode fechar esta página.</Notice>
          <PrimaryButton onClick={onBack}>Ok</PrimaryButton>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="Confirmar responsável" onBack={onBack}>
      <form onSubmit={submit} className="stack">
        <p className="lead">Se você é mãe, pai ou responsável legal de quem criou uma conta no Baseline com 16 ou 17 anos, confirme com o e-mail informado no cadastro e o código de 6 dígitos que aparece no app.</p>
        <Group footer="O código fica na tela Conta do adolescente até você confirmar.">
          <Field id="parent-email" label="Seu e-mail" type="email" inputMode="email" autoComplete="email" value={email} onChange={setEmail} placeholder="voce@exemplo.com" />
          <Field id="parent-code" label="Código" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={setCode} maxLength={8} placeholder="000000" />
        </Group>
        {error && <Notice tone="error">{error}</Notice>}
        <PrimaryButton type="submit" disabled={busy || !email.includes("@") || code.trim().length < 6}>
          {busy ? "Confirmando…" : "Confirmar"}
        </PrimaryButton>
      </form>
    </Screen>
  );
}
