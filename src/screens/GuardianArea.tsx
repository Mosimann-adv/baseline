import { useState, type FormEvent } from "react";
import { Field, Group, Notice, PlainButton, PrimaryButton, Screen } from "../components/ui";
import { useAuth } from "../state/auth";
import { ageThisYear } from "../lib/age";
import { friendlyError } from "../lib/errors";
import { checkPin, hasPin, savePin } from "../lib/pin";
import type { Athlete, Consent } from "../lib/types";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");
const GOALS = [1, 2, 3, 4, 5, 6, 7];

export function GuardianArea({
  guardianId,
  email,
  athletes,
  consents,
  onBack,
  onAddAthlete,
  onUpdateGoal,
}: {
  guardianId: string;
  email: string;
  athletes: Athlete[];
  consents: Consent[];
  onBack: () => void;
  onAddAthlete: () => void;
  onUpdateGoal: (athleteId: string, goal: number) => Promise<void>;
}) {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) return <PinGate guardianId={guardianId} onUnlock={() => setUnlocked(true)} onBack={onBack} />;
  return (
    <FamilySettings
      email={email}
      athletes={athletes}
      consents={consents}
      onBack={onBack}
      onAddAthlete={onAddAthlete}
      onUpdateGoal={onUpdateGoal}
    />
  );
}

function PinGate({ guardianId, onUnlock, onBack }: { guardianId: string; onUnlock: () => void; onBack: () => void }) {
  const { signOut } = useAuth();
  const creating = !hasPin(guardianId);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const onlyDigits = (value: string) => value.replace(/\D/g, "").slice(0, 4);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{4}$/.test(pin)) {
      setError("O PIN tem 4 números.");
      return;
    }
    if (creating) {
      if (pin !== confirmPin) {
        setError("Os dois PINs não são iguais.");
        return;
      }
      await savePin(guardianId, pin);
      onUnlock();
      return;
    }
    if (await checkPin(guardianId, pin)) onUnlock();
    else {
      setError("PIN incorreto.");
      setPin("");
    }
  }

  return (
    <Screen eyebrow="Só para adultos" title={creating ? "Crie um PIN" : "Digite o PIN"} onBack={onBack}>
      <form onSubmit={submit} className="stack">
        <Group
          footer={
            creating
              ? "O PIN protege autorizações e dados da família neste aparelho. Não compartilhe com os atletas."
              : "Esqueceu o PIN? Saia da conta e entre de novo com seu e-mail e senha para criar outro."
          }
        >
          <Field id="guardian-pin" label="PIN" type="password" inputMode="numeric" maxLength={4} autoComplete="off" value={pin} onChange={(v) => setPin(onlyDigits(v))} />
          {creating && (
            <Field id="guardian-pin-confirm" label="Repita o PIN" type="password" inputMode="numeric" maxLength={4} autoComplete="off" value={confirmPin} onChange={(v) => setConfirmPin(onlyDigits(v))} />
          )}
        </Group>
        {error && <Notice tone="error">{error}</Notice>}
        <PrimaryButton type="submit">{creating ? "Salvar PIN" : "Entrar"}</PrimaryButton>
        {!creating && <PlainButton onClick={() => void signOut()}>Esqueci o PIN, sair da conta</PlainButton>}
      </form>
    </Screen>
  );
}

function FamilySettings({
  email,
  athletes,
  consents,
  onBack,
  onAddAthlete,
  onUpdateGoal,
}: {
  email: string;
  athletes: Athlete[];
  consents: Consent[];
  onBack: () => void;
  onAddAthlete: () => void;
  onUpdateGoal: (athleteId: string, goal: number) => Promise<void>;
}) {
  const { signOut, deleteAccount } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function removeEverything() {
    setBusy(true);
    setError(null);
    try {
      await deleteAccount();
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  async function changeGoal(athleteId: string, goal: number) {
    setError(null);
    try {
      await onUpdateGoal(athleteId, goal);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  return (
    <Screen eyebrow="Área do responsável" title="Sua família" onBack={onBack}>
      <Group header="Atletas" footer="A meta é quantos treinos por semana cada atleta deve fazer. Ela aparece na tela inicial dele.">
        {athletes.map((athlete) => {
          const consent = consents.find((c) => c.athlete_id === athlete.id && !c.revoked_at);
          return (
            <div key={athlete.id} className="row">
              <span className="row-label">
                {athlete.nickname}
                <small>
                  {ageThisYear(athlete.birth_year)} anos · {consent ? `autorizado em ${formatDate(consent.accepted_at)}` : "sem autorização ativa"}
                </small>
              </span>
              <select
                className="row-select goal-select"
                aria-label={`Meta semanal de ${athlete.nickname}`}
                value={athlete.weekly_goal}
                onChange={(e) => void changeGoal(athlete.id, Number(e.target.value))}
              >
                {GOALS.map((goal) => (
                  <option key={goal} value={goal}>
                    {goal} por semana
                  </option>
                ))}
              </select>
            </div>
          );
        })}
        <button type="button" className="row row-action" onClick={onAddAthlete}>
          Adicionar atleta
        </button>
      </Group>

      <Group header="Conta" footer="Ao sair, o PIN deste aparelho é apagado.">
        <div className="row">
          <span className="row-label">E-mail</span>
          <span className="row-value">{email}</span>
        </div>
        <button type="button" className="row row-action" onClick={() => void signOut()}>
          Sair da conta
        </button>
      </Group>

      <Group header="Excluir conta" footer="Apaga a conta, os perfis de atleta, as autorizações e todos os registros. Não dá para desfazer.">
        {confirming ? (
          <>
            <p className="row-note">Tem certeza? Tudo da sua família será apagado agora.</p>
            <button type="button" className="row row-action destructive" disabled={busy} onClick={() => void removeEverything()}>
              {busy ? "Excluindo…" : "Excluir tudo definitivamente"}
            </button>
            <button type="button" className="row row-action" disabled={busy} onClick={() => setConfirming(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <button type="button" className="row row-action destructive" onClick={() => setConfirming(true)}>
            Excluir conta e dados
          </button>
        )}
      </Group>
      {error && <Notice tone="error">{error}</Notice>}
    </Screen>
  );
}
