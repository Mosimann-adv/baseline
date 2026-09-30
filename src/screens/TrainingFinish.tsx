import { useEffect, useState } from "react";
import { CountUp, Group, Notice, PlainButton, PrimaryButton, Segmented } from "../components/ui";
import { Confetti } from "../components/Confetti";
import { avatarFor } from "../lib/avatar";
import { ageThisYear } from "../lib/age";
import { friendlyError } from "../lib/errors";
import { loadQueue } from "../lib/offlineQueue";
import { clearResume, updateResumeResponses, type ResumeState } from "../lib/resumeSession";
import { useScreenBack } from "../lib/native";
import type { Athlete, NewSessionInput, Program, SessionExecution } from "../lib/types";

const FEELINGS = [{ value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }, { value: "5", label: "5" }] as const;
const DISCOMFORT = [{ value: "nao", label: "Não" }, { value: "sim", label: "Sim" }] as const;

export function Finish({ athlete, program, draft, weekCount, onExit, onSave, onOpenProgress }: {
  athlete: Athlete; program: Program; draft: ResumeState; weekCount: number;
  onExit: () => void; onSave: (input: NewSessionInput) => Promise<void>; onOpenProgress?: () => void;
}) {
  const avatar = avatarFor(athlete.id);
  const [feeling, setFeeling] = useState<string | null>(draft.responses?.feeling ?? null);
  const [discomfort, setDiscomfort] = useState<"nao" | "sim" | null>(draft.responses?.discomfort ?? null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [queued, setQueued] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const total = program.drills.length;
  const done = draft.done;
  const seconds = Math.round((draft.elapsedMs ?? 0) / 1000);
  const minutes = Math.max(0, Math.round(seconds / 60));
  const discard = () => {
    if (!confirmDiscard && done > 0) { setConfirmDiscard(true); return; }
    clearResume(athlete.guardian_id, athlete.id);
    onExit();
  };
  useScreenBack(() => { if (busy) return true; if (saved) onExit(); else discard(); return true; });
  useEffect(() => {
    if (saved || !draft.sessionId) return;
    updateResumeResponses(athlete.guardian_id, athlete.id, draft.sessionId, { feeling, discomfort });
  }, [feeling, discomfort, saved]);
  useEffect(() => {
    if (!confirmDiscard) return;
    const id = window.setTimeout(() => setConfirmDiscard(false), 5000);
    return () => window.clearTimeout(id);
  }, [confirmDiscard]);

  async function save() {
    if (busy || discomfort === null || done === 0) return;
    setBusy(true);
    setError(null);
    const blocks = program.blocks ?? [{ id: program.id, title: program.title, category: program.category }];
    const execution: SessionExecution = {
      version: 1, contentVersion: program.contentVersion ?? "2026-09-rascunho", kind: program.kind ?? "block", mode: draft.mode ?? "train",
      seconds, completed: draft.completed ?? [], trailId: draft.trailId, trailStepId: draft.trailStepId,
      blocks: blocks.map((block) => {
        const drills = program.drills.filter((drill) => (drill.blockId ?? program.id) === block.id);
        return { id: block.id, category: block.category, total: drills.length,
          done: drills.filter((drill) => draft.completed?.includes(drill.id)).length,
          seconds: Math.round(drills.reduce((sum, drill) => sum + (draft.workMs?.[drill.id] ?? 0), 0) / 1000) };
      }),
    };
    try {
      await onSave({ id: draft.sessionId, athleteId: athlete.id, programId: program.id, performedOn: draft.performedOn,
        minutes, drillsDone: done, drillsTotal: total, feeling: feeling ? Number(feeling) : null, discomfort: discomfort === "sim", execution });
      setQueued(loadQueue(athlete.guardian_id).some((item) => item.id === draft.sessionId));
      clearResume(athlete.guardian_id, athlete.id);
      setSaved(true);
    } catch (err) { setError(friendlyError(err)); }
    finally { setBusy(false); }
  }

  return (
    <main className="screen finish-screen">
      {saved && done === total && <Confetti />}
      <div className="top-bar" />
      <div className="large-title-block finish-head">
        <div className="finish-avatar" style={{ background: avatar.background }} aria-hidden="true">{avatar.glyph}</div>
        <p className="subtitle">{saved ? "Prática registrada" : done === total ? "Prática completa" : done > 0 ? "Prática parcial" : "Prática encerrada"}</p>
        <h1 className="large-title">{done > 0 ? `Boa prática, ${athlete.nickname}` : "Tudo bem parar"}</h1>
      </div>
      <div className="metrics two"><div className="metric"><strong><CountUp value={done} />/{total}</strong><span>exercícios concluídos</span></div>
        <div className="metric"><strong>{seconds < 60 ? `${seconds} s` : `${minutes} min`}</strong><span>de prática e descanso, sem pausas</span></div></div>
      {done === 0 ? <><Notice>Nenhum exercício foi concluído. Esta prática não entra na meta. Você pode começar de novo quando estiver pronto.</Notice><div className="bottom-cta"><PrimaryButton onClick={discard}>Voltar aos treinos</PrimaryButton></div></> : saved ? <div className="stack">
        <Notice tone="success">{queued ? "Guardado neste aparelho. O registro será enviado quando houver conexão." : "Seu registro foi salvo."}</Notice>
        <section className="goal-card"><p>Meta da semana</p><strong>{weekCount} de {athlete.weekly_goal} práticas</strong><p>{weekCount >= athlete.weekly_goal ? "Você cumpriu sua meta da semana." : `Faltam ${Math.max(0, athlete.weekly_goal - weekCount)} para a sua meta.`}</p></section>
        {discomfort === "sim" && <Notice>{ageThisYear(athlete.birth_year) < 18 ? "Avise um adulto e descanse. Não continue treinando com dor." : "Descanse. Não continue treinando com dor."}</Notice>}
        {onOpenProgress && <PrimaryButton onClick={onOpenProgress}>Ver minha evolução</PrimaryButton>}
        <PlainButton onClick={onExit}>Voltar aos treinos</PlainButton>
      </div> : <>
        <p className="lead">O resultado ficou neste aparelho até você salvar ou descartar.</p>
        <Group header="Como você se sentiu?" footer="Opcional. 1 = nada bem · 3 = bem · 5 = muito bem. A dificuldade não é uma nota."><div className="row"><Segmented label="Como você se sentiu, de 1 a 5" options={FEELINGS} value={feeling} onChange={setFeeling} /></div></Group>
        <Group header="Algo doeu?" footer="Escolha Sim ou Não para salvar. Não pedimos detalhes de saúde."><div className="row"><Segmented label="Algo doeu durante a prática?" options={DISCOMFORT} value={discomfort} onChange={setDiscomfort} /></div></Group>
        {discomfort === "sim" && <Notice tone="error">{ageThisYear(athlete.birth_year) < 18 ? "Pare de treinar e avise um adulto agora." : "Pare de treinar agora."} Se a dor continuar, procure um médico.</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
        <div className="stack bottom-cta">
          {discomfort === null && <p className="video-hint" role="status">Falta responder se algo doeu.</p>}
          <PrimaryButton onClick={() => void save()} disabled={busy || discomfort === null}>{busy ? "Salvando…" : "Salvar prática"}</PrimaryButton>
          <PlainButton onClick={discard} disabled={busy}>{confirmDiscard ? "Descartar mesmo?" : "Sair sem salvar"}</PlainButton>
        </div>
      </>}
    </main>
  );
}
