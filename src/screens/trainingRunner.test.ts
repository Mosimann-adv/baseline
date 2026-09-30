import { afterEach, describe, expect, it, vi } from "vitest";
import { initialFromResume, measuredState, run } from "./trainingRunner";
import type { Drill } from "../lib/types";

const drills: Drill[] = [
  { id: "a", name: "A", cue: "Dica A", seconds: 45, restSeconds: 15 },
  { id: "b", name: "B", cue: "Dica B", seconds: 30, restSeconds: 0 },
];
const act = (state: ReturnType<typeof initialFromResume>, type: Parameters<typeof run>[1]["type"], now: number) => run(state, { type, now, drills });
afterEach(() => vi.useRealTimers());

describe("execução confiável", () => {
  it("começar entra na preparação e passa automaticamente pelos exercícios", () => {
    let state = act(initialFromResume(null, drills), "start", 0);
    expect(state.phase).toBe("getready");
    expect(measuredState(state, 4000, drills).elapsedMs).toBe(0);
    state = act(state, "advance", 5000);
    expect(state).toMatchObject({ phase: "work", elapsedMs: 0, index: 0 });
    state = act(state, "advance", 50000);
    state = act(state, "advance", 65000);
    expect(state).toMatchObject({ phase: "work", index: 1, done: 1, elapsedMs: 60000 });
  });
  it("um rascunho do modo Aprender retoma o mesmo ponto como treino automático", () => {
    vi.useFakeTimers(); vi.setSystemTime(500000);
    let state = initialFromResume({ athleteId: "a1", programId: "p", phase: "learn", index: 1, done: 1,
      secondsLeft: 0, startedAt: 0, savedAt: 60000, elapsedMs: 60000, completed: ["a"], mode: "learn", workMs: { a: 45000 } }, drills);
    expect(state).toMatchObject({ phase: "getready", index: 1, done: 1, pausedLeft: null, elapsedMs: 60000, endsAt: 505000 });
    state = act(state, "advance", 505000);
    expect(state).toMatchObject({ phase: "work", index: 1, done: 1, elapsedMs: 60000 });
  });
  it("pausas longas e preparação não entram na duração", () => {
    let state = act(initialFromResume(null, drills), "start", 0);
    state = act(state, "advance", 5000);
    state = act(state, "pause", 15000);
    expect(state.elapsedMs).toBe(10000);
    state = act(state, "resume", 615000);
    state = act(state, "finish", 620000);
    expect(state.elapsedMs).toBe(15000);
    expect(state.workMs.a).toBe(15000);
  });
  it("pular todos os movimentos não os transforma em exercícios concluídos", () => {
    let state = act(initialFromResume(null, drills), "start", 0);
    state = act(state, "advance", 5000);
    state = act(state, "skip", 5001);
    state = act(state, "skip", 5002);
    expect(state).toMatchObject({ phase: "done", done: 0, completed: [] });
  });
  it("restaura descanso ampliado e conserva tempo efetivo e exercícios", () => {
    vi.useFakeTimers(); vi.setSystemTime(500000);
    const state = initialFromResume({ athleteId: "a1", programId: "p", phase: "rest", index: 0, done: 1,
      secondsLeft: 45, startedAt: 0, savedAt: 60000, elapsedMs: 45000, completed: ["a"], mode: "train", workMs: { a: 45000 } }, drills);
    expect(state).toMatchObject({ phase: "rest", pausedLeft: 45000, done: 1, elapsedMs: 45000 });
    expect(act(state, "resume", 500000).endsAt).toBe(545000);
  });
  it("a conclusão é um estado restaurável antes do salvamento", () => {
    const state = initialFromResume({ athleteId: "a1", programId: "p", phase: "done", index: 1, done: 2,
      secondsLeft: 0, startedAt: 0, savedAt: 90000, elapsedMs: 75000, completed: ["a", "b"] }, drills);
    expect(state).toMatchObject({ phase: "done", done: 2, elapsedMs: 75000 });
  });
});
