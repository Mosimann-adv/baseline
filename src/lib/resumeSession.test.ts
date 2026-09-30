import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearResume, readResume, updateResumeResponses, writeResume, type ResumeState } from "./resumeSession";

const values = new Map<string, string>();
beforeEach(() => {
  values.clear();
  vi.stubGlobal("localStorage", { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
});
afterEach(() => vi.unstubAllGlobals());
const draft = (athleteId: string): ResumeState => ({ guardianId: "g1", athleteId, programId: "p1", sessionId: `session-${athleteId}`,
  phase: "done", index: 0, done: 1, secondsLeft: 0, startedAt: 1, savedAt: 1000, elapsedMs: 999, completed: ["a"] });

describe("rascunhos por perfil", () => {
  it("iniciar em outro perfil não sobrescreve a conclusão do primeiro", () => {
    writeResume(draft("a1")); writeResume(draft("a2"));
    expect(readResume("a1", "g1")?.phase).toBe("done");
    expect(readResume("a2", "g1")?.sessionId).toBe("session-a2");
    clearResume("g1", "a2");
    expect(readResume("a1", "g1")).not.toBeNull();
  });
  it("guarda respostas explícitas sem converter ausência em Não", () => {
    writeResume(draft("a1"));
    updateResumeResponses("g1", "a1", "session-a1", { feeling: "4", discomfort: null });
    expect(readResume("a1", "g1")?.responses).toEqual({ feeling: "4", discomfort: null });
  });
  it("não entrega a uma conta o rascunho de outra", () => {
    writeResume(draft("a1"));
    expect(readResume("a1", "g2")).toBeNull();
  });
  it("migra a chave antiga só quando o atleta corresponde", () => {
    const legacy = { ...draft("a1"), guardianId: undefined };
    values.set("baseline.resume", JSON.stringify(legacy));
    expect(readResume("a2", "g1")).toBeNull();
    expect(readResume("a1", "g1")?.done).toBe(1);
    expect(values.has("baseline.resume")).toBe(false);
    expect(readResume("a1", "g1")).not.toBeNull();
  });
});
