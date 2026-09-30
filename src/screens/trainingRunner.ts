import { useEffect } from "react";
import { keepAwake } from "../lib/native";
import type { ResumeState } from "../lib/resumeSession";
import type { Drill } from "../lib/types";

type Phase = "ready" | "getready" | "work" | "rest" | "done";

export interface RunState {
  phase: Phase;
  index: number;
  endsAt: number;
  pausedLeft: number | null;
  done: number;
  startedAt: number | null;
  elapsedMs: number;
  measuredAt: number | null;
  completed: string[];
  workMs: Record<string, number>;
}

export interface TrainingAction {
  type: "start" | "advance" | "complete" | "skip" | "extend" | "pause" | "resume" | "finish";
  now: number;
  drills: Drill[];
}

const INITIAL: RunState = { phase: "ready", index: 0, endsAt: 0, pausedLeft: null, done: 0, startedAt: null,
  elapsedMs: 0, measuredAt: null, completed: [], workMs: {} };

/** Só trabalho e descanso contam. Preparação e pausas não viram minutos. */
export function measuredState(state: RunState, now: number, drills: Drill[]): RunState {
  if (state.measuredAt === null || state.pausedLeft !== null || !["work", "rest"].includes(state.phase)) return state;
  const delta = Math.max(0, Math.min(now, state.endsAt) - state.measuredAt);
  const id = drills[state.index]?.id;
  return { ...state, elapsedMs: state.elapsedMs + delta, measuredAt: Math.min(now, state.endsAt),
    workMs: state.phase === "work" && id ? { ...state.workMs, [id]: (state.workMs[id] ?? 0) + delta } : state.workMs };
}

// Volta ao ponto em que o treino parou, já pausado: quem treina vê quanto restava e decide continuar.
// Rascunhos do antigo modo Aprender entram na preparação, sem perder o exercício
// atual ou o que já foi concluído. O tempo com o app fechado não entra na duração.
export function initialFromResume(resume: ResumeState | null | undefined, drills: Drill[]): RunState {
  if (!resume) return INITIAL;
  const drill = drills[resume.index];
  if (!drill) return INITIAL;
  const completed = resume.completed?.filter((id) => drills.some((d) => d.id === id)) ?? drills.slice(0, resume.done).map((d) => d.id);
  // Descanso ampliado é válido. Só limitamos valores corrompidos, não o descanso original.
  if (resume.secondsLeft > 24 * 60 * 60) return INITIAL;
  const legacyLearning = resume.phase === "learn";
  return {
    ...INITIAL,
    phase: resume.phase === "learn" ? "getready" : resume.phase,
    index: resume.index,
    done: completed.length,
    endsAt: legacyLearning ? Date.now() + 5000 : 0,
    pausedLeft: legacyLearning || resume.phase === "done" ? null : resume.secondsLeft * 1000,
    startedAt: resume.startedAt,
    elapsedMs: resume.elapsedMs ?? Math.max(0, (resume.savedAt - (resume.startedAt ?? resume.savedAt))),
    completed,
    workMs: resume.workMs ?? {},
  };
}

// Contagem pelo relógio (endsAt), não por ticks: o intervalo atrasa com a tela bloqueada ou o app em segundo plano.
export function run(previous: RunState, action: TrainingAction): RunState {
  const { drills, now } = action;
  const state = measuredState(previous, now, drills);
  const last = drills.length - 1;
  const workFrom = (index: number): RunState => ({ ...state, phase: "work", index, endsAt: now + drills[index].seconds * 1000, pausedLeft: null, measuredAt: now });
  const finishWork = (): RunState => {
    const completed = [...new Set([...state.completed, drills[state.index].id])];
    const finished = { ...state, done: completed.length, completed, measuredAt: null };
    if (state.index >= last) return { ...finished, phase: "done", pausedLeft: null };
    const rest = drills[state.index].restSeconds;
    if (rest > 0) return { ...finished, phase: "rest", endsAt: now + rest * 1000, pausedLeft: null, measuredAt: now };
    return { ...workFrom(state.index + 1), done: completed.length, completed };
  };

  switch (action.type) {
    case "start":
      return { ...INITIAL, phase: "getready", endsAt: now + 5000, startedAt: now };
    case "pause":
      if (state.pausedLeft !== null || !["work", "rest", "getready"].includes(state.phase)) return state;
      return { ...state, pausedLeft: Math.max(0, state.endsAt - now), measuredAt: null };
    case "resume":
      if (state.pausedLeft === null) return state;
      return { ...state, endsAt: now + state.pausedLeft, pausedLeft: null, measuredAt: ["work", "rest"].includes(state.phase) ? now : null };
    case "finish":
      return { ...state, phase: "done", pausedLeft: null, measuredAt: null };
    case "advance":
      if (state.pausedLeft !== null) return state;
      if (state.phase === "getready") return workFrom(state.index);
      if (state.phase === "work") return finishWork();
      if (state.phase === "rest") return workFrom(state.index + 1);
      return state;
    case "complete":
      return state.phase === "work" ? finishWork() : state;
    case "skip":
      if (state.phase === "rest") return workFrom(state.index + 1);
      if (state.phase !== "work") return state;
      if (state.index >= last) return { ...state, phase: "done", pausedLeft: null, measuredAt: null };
      return workFrom(state.index + 1);
    case "extend":
      // Descanso que não corta: ir buscar água ou atender não pode custar o próximo exercício.
      if (state.phase !== "rest") return state;
      if (state.pausedLeft !== null) return { ...state, pausedLeft: state.pausedLeft + 15000 };
      return { ...state, endsAt: state.endsAt + 15000 };
  }
  return state;
}

// Tela acesa durante o treino: wake lock do navegador com fallback do Capacitor.
export function useWakeLock(active: boolean) {
  useEffect(() => {
    void keepAwake(active);
    if (!active || !("wakeLock" in navigator)) {
      return () => {
        void keepAwake(false);
      };
    }
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = () =>
      navigator.wakeLock
        .request("screen")
        .then((sentinel) => {
          if (cancelled) void sentinel.release();
          else lock = sentinel;
        })
        .catch(() => undefined);
    void request();
    const onVisible = () => {
      if (document.visibilityState === "visible" && (!lock || lock.released)) void request();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
      void keepAwake(false);
    };
  }, [active]);
}
