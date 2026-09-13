import { requireSupabase } from "./supabase";
import { localIsoDate } from "./dates";
import { isDuplicateKey, isNetworkError, isRlsError } from "./errors";
import type { NewSessionInput, NewTestInput, SkillTestRecord, TrainingSession } from "./types";

const keyFor = (guardianId: string) => `baseline.queue.${guardianId}`;

export type QueueKind = "session" | "test";

export interface QueuedSession extends NewSessionInput {
  kind: "session";
  id: string;
  guardianId: string;
  performedOn: string;
  createdAt: string;
  blocked?: boolean;
  lastError?: string | null;
}

export interface QueuedTest extends NewTestInput {
  kind: "test";
  id: string;
  guardianId: string;
  testedOn: string;
  createdAt: string;
  blocked?: boolean;
  lastError?: string | null;
}

export type QueueItem = QueuedSession | QueuedTest;

function read(guardianId: string): QueueItem[] {
  try {
    const raw = localStorage.getItem(keyFor(guardianId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(guardianId: string, items: QueueItem[]): void {
  try {
    if (items.length === 0) localStorage.removeItem(keyFor(guardianId));
    else localStorage.setItem(keyFor(guardianId), JSON.stringify(items));
  } catch {
    // Sem armazenamento: a fila desta visita fica só na memória do hook.
  }
}

export function loadQueue(guardianId: string): QueueItem[] {
  return read(guardianId);
}

export function enqueue(item: QueueItem): void {
  const items = read(item.guardianId).filter((current) => current.id !== item.id);
  items.push(item);
  write(item.guardianId, items);
}

export function dropFromQueue(guardianId: string, id: string): void {
  write(
    guardianId,
    read(guardianId).filter((item) => item.id !== id),
  );
}

export function markBlocked(guardianId: string, id: string, lastError: string): void {
  write(
    guardianId,
    read(guardianId).map((item) => (item.id === id ? { ...item, blocked: true, lastError } : item)),
  );
}

export function queuedSessions(guardianId: string, athleteId?: string): TrainingSession[] {
  return read(guardianId)
    .filter((item): item is QueuedSession => item.kind === "session" && (!athleteId || item.athleteId === athleteId))
    .map((item) => ({
      id: item.id,
      guardian_id: item.guardianId,
      athlete_id: item.athleteId,
      program_id: item.programId,
      performed_on: item.performedOn,
      minutes: item.minutes,
      drills_done: item.drillsDone,
      drills_total: item.drillsTotal,
      feeling: item.feeling,
      discomfort: item.discomfort,
      created_at: item.createdAt,
      pending: true,
      pendingError: item.lastError ?? null,
    }));
}

export function queuedTests(guardianId: string, athleteId?: string): SkillTestRecord[] {
  return read(guardianId)
    .filter((item): item is QueuedTest => item.kind === "test" && (!athleteId || item.athleteId === athleteId))
    .map((item) => ({
      id: item.id,
      guardian_id: item.guardianId,
      athlete_id: item.athleteId,
      tested_on: item.testedOn,
      results: item.results,
      created_at: item.createdAt,
      pending: true,
      pendingError: item.lastError ?? null,
    }));
}

function mergeById<T extends { id: string }>(server: T[], pending: T[]): T[] {
  const sent = new Set(server.map((row) => row.id));
  return [...pending.filter((row) => !sent.has(row.id)), ...server];
}

export function mergeSessions(guardianId: string, server: TrainingSession[]): TrainingSession[] {
  return mergeById(server, queuedSessions(guardianId));
}

export function mergeTests(guardianId: string, server: SkillTestRecord[]): SkillTestRecord[] {
  return mergeById(server, queuedTests(guardianId));
}

async function sendItem(item: QueueItem): Promise<"sent" | "blocked"> {
  const client = requireSupabase();
  if (item.kind === "session") {
    const { error } = await client.from("training_sessions").insert({
      id: item.id,
      guardian_id: item.guardianId,
      athlete_id: item.athleteId,
      program_id: item.programId,
      performed_on: item.performedOn,
      minutes: item.minutes,
      drills_done: item.drillsDone,
      drills_total: item.drillsTotal,
      feeling: item.feeling,
      discomfort: item.discomfort,
    });
    if (!error || isDuplicateKey(error)) return "sent";
    if (isRlsError(error)) throw error;
    throw error;
  }
  const { error } = await client.from("skill_tests").insert({
    id: item.id,
    guardian_id: item.guardianId,
    athlete_id: item.athleteId,
    tested_on: item.testedOn,
    results: item.results,
  });
  if (!error || isDuplicateKey(error)) return "sent";
  if (isRlsError(error)) throw error;
  throw error;
}

/** Envia a fila. `23505` conta como enviado. Recusa por aceite: o item fica e recebe o motivo. */
export async function flushQueue(guardianId: string): Promise<{ sent: number; blocked: number; remaining: number }> {
  const items = read(guardianId);
  let sent = 0;
  let blocked = 0;
  for (const item of items) {
    try {
      const result = await sendItem(item);
      if (result === "sent") {
        dropFromQueue(guardianId, item.id);
        sent += 1;
      }
    } catch (err) {
      if (isNetworkError(err)) break;
      if (isRlsError(err)) {
        markBlocked(guardianId, item.id, "Este perfil está sem aceite ativo. Dê o consentimento ou a autorização de novo na tela Conta.");
        blocked += 1;
        continue;
      }
      markBlocked(guardianId, item.id, "Não foi possível enviar. Tente de novo.");
      blocked += 1;
    }
  }
  return { sent, blocked, remaining: read(guardianId).length };
}

export function newQueuedSession(guardianId: string, input: NewSessionInput): QueuedSession {
  return {
    kind: "session",
    id: crypto.randomUUID(),
    guardianId,
    ...input,
    performedOn: localIsoDate(),
    createdAt: new Date().toISOString(),
  };
}

export function newQueuedTest(guardianId: string, input: NewTestInput): QueuedTest {
  return {
    kind: "test",
    id: crypto.randomUUID(),
    guardianId,
    ...input,
    testedOn: localIsoDate(),
    createdAt: new Date().toISOString(),
  };
}

export function pendingSummary(guardianId: string, athleteId: string): { count: number; blocked: boolean; error: string | null } {
  const items = read(guardianId).filter((item) => item.athleteId === athleteId);
  const blocked = items.some((item) => item.blocked);
  return {
    count: items.length,
    blocked,
    error: items.find((item) => item.lastError)?.lastError ?? null,
  };
}
