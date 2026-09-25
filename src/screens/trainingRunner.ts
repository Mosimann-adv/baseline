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
}

export interface TrainingAction {
  type: "start" | "advance" | "skip" | "extend" | "pause" | "resume" | "finish";
  now: number;
  drills: Drill[];
}

const INITIAL: RunState = { phase: "ready", index: 0, endsAt: 0, pausedLeft: null, done: 0, startedAt: null };

// Volta ao ponto em que o treino parou, já pausado: quem treina vê quanto restava e decide continuar.
// "Prepare-se" recomeça a contagem de 3 s; marca fora dos limites do programa cai no começo.
// O relógio de duração é rebaseado: o tempo com o app fechado não entra como treino
// (agora − (salvo − começou) mantém só o que correu de verdade).
export function initialFromResume(resume: ResumeState | null | undefined, drills: Drill[]): RunState {
  if (!resume) return INITIAL;
  const startedAt =
    resume.startedAt !== null && resume.savedAt > resume.startedAt ? Date.now() - (resume.savedAt - resume.startedAt) : resume.startedAt;
  if (resume.phase === "getready") {
    return { ...INITIAL, phase: "getready", endsAt: Date.now() + 3000, startedAt };
  }
  const drill = drills[resume.index];
  if (!drill) return INITIAL;
  const limit = (resume.phase === "rest" ? drill.restSeconds : drill.seconds) + 5;
  if (resume.secondsLeft <= 0 || resume.secondsLeft > limit) return INITIAL;
  return {
    ...INITIAL,
    phase: resume.phase,
    index: resume.index,
    done: Math.max(0, Math.min(resume.done, resume.index + 1)),
    pausedLeft: resume.secondsLeft * 1000,
    startedAt,
  };
}

// Contagem pelo relógio (endsAt), não por ticks: o intervalo atrasa com a tela bloqueada ou o app em segundo plano.
export function run(state: RunState, action: TrainingAction): RunState {
  const { drills, now } = action;
  const last = drills.length - 1;
  const workFrom = (index: number): RunState => ({ ...state, phase: "work", index, endsAt: now + drills[index].seconds * 1000, pausedLeft: null });

  switch (action.type) {
    case "start":
      // 3 s para largar o celular e pegar a bola antes do primeiro exercício.
      return { ...INITIAL, phase: "getready", endsAt: now + 3000, startedAt: now };
    case "pause":
      if (state.pausedLeft !== null || (state.phase !== "work" && state.phase !== "rest")) return state;
      return { ...state, pausedLeft: Math.max(0, state.endsAt - now) };
    case "resume":
      if (state.pausedLeft === null) return state;
      return { ...state, endsAt: now + state.pausedLeft, pausedLeft: null };
    case "finish":
      return { ...state, phase: "done", pausedLeft: null };
    case "advance":
      if (state.phase === "getready") return workFrom(0);
      if (state.phase === "work") {
        const done = state.done + 1;
        if (state.index >= last) return { ...state, phase: "done", done, pausedLeft: null };
        const rest = drills[state.index].restSeconds;
        if (rest > 0) return { ...state, phase: "rest", done, endsAt: now + rest * 1000, pausedLeft: null };
        return { ...workFrom(state.index + 1), done };
      }
      if (state.phase === "rest") return workFrom(state.index + 1);
      return state;
    case "skip":
      if (state.phase === "rest") return workFrom(state.index + 1);
      if (state.phase !== "work") return state;
      if (state.index >= last) return { ...state, phase: "done", pausedLeft: null };
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
