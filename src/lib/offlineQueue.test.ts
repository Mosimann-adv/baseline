import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RLS_BLOCKED_MESSAGE } from "./errors";
import {
  dropFromQueue,
  enqueue,
  flushQueue,
  loadQueue,
  markBlocked,
  mergeSessions,
  newQueuedSession,
  newQueuedTest,
  pendingSummary,
  purgeAthleteFromQueue,
  queuedSessions,
} from "./offlineQueue";

// Cliente falso: cada teste escolhe o erro que o insert devolve.
const supabaseStub = vi.hoisted(() => ({ error: null as unknown }));
vi.mock("./supabase", () => ({
  requireSupabase: () => ({
    from: () => ({
      insert: async () => ({ error: supabaseStub.error }),
    }),
  }),
}));

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

describe("limpeza da fila", () => {
  it("purge tira da fila todos os itens do perfil excluído e só deles", () => {
    enqueue(newQueuedSession(GUARDIAN, input));
    enqueue(newQueuedSession(GUARDIAN, { ...input, athleteId: "outro" }));
    enqueue(newQueuedTest(GUARDIAN, { athleteId: ATHLETE, results: { salto: 150 } }));
    purgeAthleteFromQueue(GUARDIAN, ATHLETE);
    const restantes = loadQueue(GUARDIAN);
    expect(restantes).toHaveLength(1);
    expect(restantes[0].athleteId).toBe("outro");
  });
});

describe("envio da fila", () => {
  beforeEach(() => {
    supabaseStub.error = null;
  });

  const networkError = { code: "", message: "Failed to fetch" };
  const genericError = { code: "XX000", message: "falha do servidor" };
  const rlsError = { code: "42501", message: "new row violates row-level security policy" };

  it("envia o item e limpa a fila quando o banco aceita", async () => {
    enqueue(newQueuedSession(GUARDIAN, input));
    const result = await flushQueue(GUARDIAN);
    expect(result.sent).toBe(1);
    expect(loadQueue(GUARDIAN)).toHaveLength(0);
  });

  it("rede caiu: para sem marcar nem contar tentativa", async () => {
    supabaseStub.error = networkError;
    enqueue(newQueuedSession(GUARDIAN, input));
    const result = await flushQueue(GUARDIAN);
    expect(result.sent).toBe(0);
    const [item] = loadQueue(GUARDIAN);
    expect(item.attempts).toBeUndefined();
    expect(item.blocked).toBeFalsy();
  });

  it("RLS: item fica bloqueado com o motivo do aceite", async () => {
    supabaseStub.error = rlsError;
    enqueue(newQueuedSession(GUARDIAN, input));
    await flushQueue(GUARDIAN);
    const summary = pendingSummary(GUARDIAN, ATHLETE);
    expect(summary.blocked).toBe(true);
    expect(summary.error).toBe(RLS_BLOCKED_MESSAGE);
  });

  it("erro comum: repete algumas vezes e depois desiste em segundo plano, sem perder o registro", async () => {
    supabaseStub.error = genericError;
    enqueue(newQueuedSession(GUARDIAN, input));
    for (let i = 0; i < 8; i += 1) {
      await flushQueue(GUARDIAN); // MAX_ATTEMPTS
    }
    const [item] = loadQueue(GUARDIAN);
    expect(item.givenUp).toBe(true);
    expect(item.attempts).toBe(8);

    // Desistido não entra mais no envio automático: as tentativas param de subir.
    await flushQueue(GUARDIAN);
    expect(loadQueue(GUARDIAN)[0].attempts).toBe(8);
    expect(pendingSummary(GUARDIAN, ATHLETE).count).toBe(1);
  });

  it("resetRetries faz o item desistido tentar de novo", async () => {
    supabaseStub.error = genericError;
    enqueue(newQueuedSession(GUARDIAN, input));
    for (let i = 0; i < 8; i += 1) {
      await flushQueue(GUARDIAN);
    }
    supabaseStub.error = null;
    const result = await flushQueue(GUARDIAN, { resetRetries: true });
    expect(result.sent).toBe(1);
    expect(loadQueue(GUARDIAN)).toHaveLength(0);
  });
});
