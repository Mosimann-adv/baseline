import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dropFromQueue, enqueue, loadQueue, markBlocked, mergeSessions, newQueuedSession, pendingSummary, queuedSessions } from "./offlineQueue";

const GUARDIAN = "g1";
const ATHLETE = "a1";

function stubLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  });
}

beforeEach(stubLocalStorage);
afterEach(() => vi.unstubAllGlobals());

const input = { athleteId: ATHLETE, programId: "p1", minutes: 18, drillsDone: 4, drillsTotal: 4, feeling: 4, discomfort: false };

describe("fila offline", () => {
  it("item novo entra na fila com UUID do cliente", () => {
    const item = newQueuedSession(GUARDIAN, input);
    expect(item.id).toMatch(/^[0-9a-f-]{36}$/);
    enqueue(item);
    expect(loadQueue(GUARDIAN)).toHaveLength(1);
  });

  it("recolocar o mesmo item não duplica", () => {
    const item = newQueuedSession(GUARDIAN, input);
    enqueue(item);
    enqueue(item);
    expect(loadQueue(GUARDIAN)).toHaveLength(1);
  });

  it("item enviado sai da fila", () => {
    const item = newQueuedSession(GUARDIAN, input);
    enqueue(item);
    dropFromQueue(GUARDIAN, item.id);
    expect(loadQueue(GUARDIAN)).toHaveLength(0);
  });

  it("item bloqueado guarda o motivo para a tela mostrar", () => {
    const item = newQueuedSession(GUARDIAN, input);
    enqueue(item);
    markBlocked(GUARDIAN, item.id, "sem aceite ativo");
    const summary = pendingSummary(GUARDIAN, ATHLETE);
    expect(summary).toEqual({ count: 1, blocked: true, error: "sem aceite ativo" });
  });

  it("resumo por atleta ignora itens de outro perfil", () => {
    enqueue(newQueuedSession(GUARDIAN, { ...input, athleteId: "outro" }));
    expect(pendingSummary(GUARDIAN, ATHLETE).count).toBe(0);
  });

  it("queuedSessions vira TrainingSession com bandeira de pendente", () => {
    enqueue(newQueuedSession(GUARDIAN, input));
    const [row] = queuedSessions(GUARDIAN, ATHLETE);
    expect(row.pending).toBe(true);
    expect(row.program_id).toBe("p1");
    expect(row.athlete_id).toBe(ATHLETE);
  });

  it("merge tira da fila o que o servidor já recebeu (mesmo id)", () => {
    const item = newQueuedSession(GUARDIAN, input);
    enqueue(item);
    const serverRow = queuedSessions(GUARDIAN, ATHLETE)[0];
    const merged = mergeSessions(GUARDIAN, [{ ...serverRow, pending: false }]);
    expect(merged).toHaveLength(1);
    expect(merged[0].pending).toBe(false);
  });
});
