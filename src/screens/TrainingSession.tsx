import { useEffect, useLayoutEffect, useReducer, useState } from "react";
import { Notice, PlainButton, PrimaryButton } from "../components/ui";
import { ExerciseVideo } from "../components/ExerciseVideo";
import { writeResume, type ResumeState } from "../lib/resumeSession";
import { localIsoDate } from "../lib/dates";
import { useScreenBack } from "../lib/native";
import { cue, say, unlockAudio } from "../lib/sounds";
import type { Athlete, NewSessionInput, Program } from "../lib/types";
import { Finish } from "./TrainingFinish";
import { initialFromResume, measuredState, run, useWakeLock, type TrainingAction } from "./trainingRunner";

const clock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

export function TrainingSession({ athlete, program, resume, weekCount = 0, onExit, onSave, onOpenProgress }: {
  athlete: Athlete; program: Program; resume?: ResumeState | null; weekCount?: number;
  onExit: () => void; onSave: (input: NewSessionInput) => Promise<void>; onOpenProgress?: () => void;
}) {
  const drills = program.drills;
  const [state, dispatch] = useReducer(run, drills, (items) => initialFromResume(resume, items));
  const [sessionId] = useState(() => resume?.sessionId ?? crypto.randomUUID());
  const [performedOn] = useState(() => resume?.performedOn ?? localIsoDate());
  const [now, setNow] = useState(Date.now);
  const [confirmExit, setConfirmExit] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  const act = (type: TrainingAction["type"]) => {
    unlockAudio();
    const at = Date.now();
    setNow(at);
    dispatch({ type, now: at, drills });
  };
  useEffect(() => { if (!resume || initialFromResume(resume, drills).phase === "ready") dispatch({ type: "start", now: Date.now(), drills }); }, []);
  const running = ["work", "rest", "getready"].includes(state.phase) && state.pausedLeft === null;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [running]);
  useEffect(() => { if (running && state.endsAt <= now) dispatch({ type: "advance", now: Date.now(), drills }); }, [running, now, state.endsAt, drills]);
  useEffect(() => {
    if (!running) return;
    const hide = () => { if (document.hidden) act("pause"); };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, [running, state.phase, state.index]);
  useEffect(() => {
    if (!confirmExit) return;
    const id = window.setTimeout(() => setConfirmExit(false), 5000);
    return () => window.clearTimeout(id);
  }, [confirmExit]);
  useEffect(() => { setConfirmExit(false); }, [state.phase, state.index]);
  const requestExit = () => {
    if (state.phase === "ready") return onExit();
    if (confirmExit) act("finish");
    else { act("pause"); setConfirmExit(true); }
  };
  useScreenBack(() => { requestExit(); return true; }, state.phase !== "done");
  useWakeLock(state.phase !== "done");

  const left = state.pausedLeft ?? Math.max(0, state.endsAt - now);
  const snapshot = measuredState(state, now, drills);
  const draft: ResumeState = {
    guardianId: athlete.guardian_id, athleteId: athlete.id, programId: program.id, sessionId, performedOn,
    mode: resume?.phase === "done" ? resume.mode ?? "train" : "train", phase: state.phase === "ready" ? "getready" : state.phase, index: state.index, done: state.done,
    secondsLeft: Math.ceil(left / 1000), startedAt: state.startedAt, savedAt: Date.now(), elapsedMs: snapshot.elapsedMs,
    // Metadados antigos continuam junto do rascunho, sem reabrir o fluxo de trilhas.
    completed: state.completed, workMs: snapshot.workMs, trailId: resume?.trailId, trailStepId: resume?.trailStepId,
    responses: resume?.responses,
  };
  const savedSecond = Math.ceil(left / 1000);
  useLayoutEffect(() => {
    if (state.phase === "ready") return;
    setStorageFailed(!writeResume(draft));
  }, [state.phase, state.index, state.done, state.pausedLeft, savedSecond]);
  useEffect(() => {
    if (state.phase === "work") { navigator.vibrate?.(60); cue("up"); say(`${drills[state.index].name}. ${drills[state.index].cue}`); }
    if (state.phase === "rest") { cue("down"); const next = drills[state.index + 1]; if (next) say(`Próximo: ${next.name}`); }
    if (state.phase === "done" && state.done > 0) cue("done");
  }, [state.phase, state.index]);
  const restSeconds = state.phase === "rest" ? savedSecond : 0;
  useEffect(() => { if (running && restSeconds > 0 && restSeconds <= 3) cue("tick"); }, [restSeconds, running]);

  if (state.phase === "done") return <Finish athlete={athlete} program={program} draft={draft} weekCount={weekCount}
    onExit={onExit} onSave={onSave} onOpenProgress={onOpenProgress} />;

  const resting = state.phase === "rest";
  const drill = drills[Math.min(state.index + (resting ? 1 : 0), drills.length - 1)];
  const video = state.phase === "work" && drill.video?.previewOnly ? undefined : drill.video;
  const phase = state.phase === "getready" ? "Prepare-se" : resting ? "Descanso" : state.pausedLeft !== null ? "Pausado" : "Agora";
  const ending = running && ["rest", "work"].includes(state.phase) && left > 0 && left <= 3000;
  return (
    <main className={`training ${state.phase === "work" && running ? "focus" : ""}`}>
      <div className="training-top">
        <button type="button" className="back-button" onClick={requestExit}>{confirmExit ? "Encerrar mesmo?" : "Encerrar"}</button>
        <span className="training-count">Exercício {state.index + 1} de {drills.length}</span>
      </div>
      <div className="progress-line" aria-hidden="true"><span style={{ width: `${(state.done / drills.length) * 100}%` }} /></div>
      {storageFailed && <Notice>Este aparelho não permitiu guardar a retomada. Mantenha o app aberto até salvar.</Notice>}
      {confirmExit && <Notice>Encerrar leva ao registro do que você fez. Toque de novo para confirmar.</Notice>}
      <section className={`training-body ${video ? "with-video" : ""} ${state.phase === "getready" ? "preparing" : ""}`}>
        {video && <ExerciseVideo key={`${drill.id}-${video.id}`} video={video} playing={running && (state.phase === "work" || resting)} />}
        <p className="phase-label" role="status">{phase}</p>
        <h1 className="drill-name">{resting ? `Próximo: ${drill.name}` : drill.name}</h1>
        <p className="drill-cue">{drill.cue}</p>
        {drill.focus && !video && <p className="focus-hint">Foco: {drill.focus}</p>}
        {["getready", "rest", "work"].includes(state.phase) && <p className={`countdown ${ending ? "ending" : ""}`} aria-live="off">{clock(left)}</p>}
      </section>
      <div className="training-actions">
        {state.phase === "getready" && <PrimaryButton onClick={() => act(state.pausedLeft === null ? "pause" : "resume")}>{state.pausedLeft === null ? "Pausar preparação" : "Continuar preparação"}</PrimaryButton>}
        {state.phase === "work" && <>
          <PrimaryButton onClick={() => act(state.pausedLeft === null ? "pause" : "resume")}>{state.pausedLeft === null ? "Pausar" : "Continuar"}</PrimaryButton>
          <div className="rest-row"><PlainButton onClick={() => act("complete")}>Concluir exercício</PlainButton><PlainButton onClick={() => act("skip")}>Pular exercício</PlainButton></div>
        </>}
        {resting && <>
          <PrimaryButton onClick={() => act("skip")}>Pular descanso</PrimaryButton>
          <div className="rest-row"><PlainButton onClick={() => act("extend")}>+15 s de descanso</PlainButton><PlainButton onClick={() => act(state.pausedLeft === null ? "pause" : "resume")}>{state.pausedLeft === null ? "Pausar" : "Continuar"}</PlainButton></div>
        </>}
      </div>
    </main>
  );
}
