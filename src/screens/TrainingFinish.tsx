import { useEffect, useState } from "react";
import { CountUp, Group, Notice, PlainButton, PrimaryButton, Segmented } from "../components/ui";
import { Confetti } from "../components/Confetti";
import { avatarFor } from "../lib/avatar";
import { friendlyError } from "../lib/errors";
import type { Athlete, NewSessionInput, Program } from "../lib/types";

const FEELINGS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
] as const;

const DISCOMFORT = [
  { value: "nao", label: "Não" },
  { value: "sim", label: "Sim" },
] as const;

// Fim do treino: avatar, confete, "como foi" e o registro (com fila offline quando não há internet).
export function Finish({
  athlete,
  program,
  done,
  startedAt,
  onExit,
  onSave,
}: {
  athlete: Athlete;
  program: Program;
  done: number;
  startedAt: number | null;
  onExit: () => void;
  onSave: (input: NewSessionInput) => Promise<void>;
}) {
  const avatar = avatarFor(athlete.id);
  const [minutes] = useState(() => Math.max(1, Math.round((Date.now() - (startedAt ?? Date.now())) / 60000)));
  const [feeling, setFeeling] = useState<(typeof FEELINGS)[number]["value"] | null>(null);
  const [discomfort, setDiscomfort] = useState<"nao" | "sim" | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Sair sem salvar descarta o registro: pede confirmação em dois passos, como as outras ações sem volta.
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  useEffect(() => {
    if (!confirmDiscard) return;
    const id = window.setTimeout(() => setConfirmDiscard(false), 4000);
    return () => window.clearTimeout(id);
  }, [confirmDiscard]);
  const total = program.drills.length;

  // Confirma o salvamento na tela antes de voltar — sem internet, o treino fica na fila e sobe depois.
  useEffect(() => {
    if (!saved) return;
    const id = window.setTimeout(onExit, 1800);
    return () => window.clearTimeout(id);
  }, [saved, onExit]);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await onSave({
        athleteId: athlete.id,
        programId: program.id,
        minutes,
        drillsDone: done,
        drillsTotal: total,
        feeling: feeling ? Number(feeling) : null,
        discomfort: discomfort === "sim",
      });
      setSaved(true);
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <main className="screen">
      <Confetti />
      <div className="top-bar" />
      <div className="large-title-block finish-head">
        <div className="finish-avatar" style={{ background: avatar.background }} aria-hidden="true">
          {avatar.glyph}
        </div>
        <p className="subtitle">{done === total ? "Treino completo" : "Treino encerrado"}</p>
        <h1 className="large-title">Mandou bem, {athlete.nickname}</h1>
      </div>
      <div className="metrics two">
        <div className="metric">
          <strong>
            <CountUp value={done} />/{total}
          </strong>
          <span>exercícios</span>
        </div>
        <div className="metric">
          <strong>
            <CountUp value={minutes} />
          </strong>
          <span>{minutes === 1 ? "minuto" : "minutos"}</span>
        </div>
      </div>
      <Group header="Como foi o treino?" footer="1 = foi bem difícil · 5 = foi ótimo">
        <div className="row">
          <Segmented label="Como foi o treino, de 1 a 5" options={FEELINGS} value={feeling} onChange={setFeeling} />
        </div>
      </Group>
      <Group header="Algo doeu?">
        <div className="row">
          <Segmented label="Algo doeu durante o treino?" options={DISCOMFORT} value={discomfort} onChange={setDiscomfort} />
        </div>
      </Group>
      {discomfort === "sim" && (
        <Notice tone="error">
          {athlete.is_self ? "Pare de treinar agora." : "Pare de treinar e conte para um adulto agora."} Se a dor continuar, procure um médico.
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {saved ? (
        <Notice tone="success">Treino salvo! Até a próxima.</Notice>
      ) : (
        <div className="stack bottom-cta">
          <PrimaryButton onClick={() => void save()} disabled={busy}>
            {busy ? "Salvando…" : "Salvar treino"}
          </PrimaryButton>
          <PlainButton onClick={() => (confirmDiscard ? onExit() : setConfirmDiscard(true))} disabled={busy}>
            {confirmDiscard ? "Descartar mesmo?" : "Sair sem salvar"}
          </PlainButton>
        </div>
      )}
    </main>
  );
}
