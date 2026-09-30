import type { TrainingMode } from "./types";

const LEGACY_KEY = "baseline.resume";
const keyFor = (guardianId: string, athleteId: string) => `baseline.resume.${guardianId}.${athleteId}`;

export interface ResumeState {
  athleteId: string;
  guardianId?: string;
  programId: string;
  sessionId?: string;
  performedOn?: string;
  mode?: TrainingMode;
  phase: "learn" | "getready" | "work" | "rest" | "done";
  index: number;
  done: number;
  secondsLeft: number;
  startedAt: number | null;
  savedAt: number;
  elapsedMs?: number;
  completed?: string[];
  workMs?: Record<string, number>;
  trailId?: string;
  trailStepId?: string;
  responses?: { feeling: string | null; discomfort: "nao" | "sim" | null };
}

function parse(raw: string | null): ResumeState | null {
  if (!raw) return null;
  try {
    const state = JSON.parse(raw) as ResumeState;
    if (!state || typeof state.athleteId !== "string" || typeof state.programId !== "string" ||
      !["learn", "getready", "work", "rest", "done"].includes(state.phase) ||
      !Number.isInteger(state.index) || state.index < 0 || !Number.isFinite(state.secondsLeft) || state.secondsLeft < 0 ||
      !Number.isInteger(state.done) || state.done < 0 || !Number.isFinite(state.savedAt)) return null;
    return state;
  } catch {
    return null;
  }
}

export function readResume(athleteId: string, guardianId?: string): ResumeState | null {
  try {
    const own = guardianId ? parse(localStorage.getItem(keyFor(guardianId, athleteId))) : null;
    if (own?.athleteId === athleteId && own.guardianId === guardianId) return own;
    const legacy = parse(localStorage.getItem(LEGACY_KEY));
    if (legacy?.athleteId !== athleteId) return null;
    if (guardianId) {
      writeResume({ ...legacy, guardianId });
      localStorage.removeItem(LEGACY_KEY);
    }
    return legacy;
  } catch {
    return null;
  }
}

export function writeResume(state: ResumeState): boolean {
  try {
    localStorage.setItem(state.guardianId ? keyFor(state.guardianId, state.athleteId) : LEGACY_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearResume(guardianId?: string, athleteId?: string): void {
  try {
    if (guardianId && athleteId) localStorage.removeItem(keyFor(guardianId, athleteId));
    const legacy = parse(localStorage.getItem(LEGACY_KEY));
    if (!athleteId || legacy?.athleteId === athleteId) localStorage.removeItem(LEGACY_KEY);
  } catch {
    // O registro definitivo continua no servidor ou na fila offline.
  }
}

export function updateResumeResponses(guardianId: string, athleteId: string, sessionId: string, responses: NonNullable<ResumeState["responses"]>): void {
  const state = readResume(athleteId, guardianId);
  if (state?.sessionId === sessionId) writeResume({ ...state, responses });
}
