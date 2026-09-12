import type { Session } from "@supabase/supabase-js";
import type { Athlete, Consent, NewAthleteInput, NewSessionInput, TrainingSession } from "./types";
import { CONSENT_VERSION } from "./consent";
import { MAX_AGE, MIN_AGE, ageThisYear } from "./age";
import { localIsoDate } from "./dates";

// Modo demonstração: sessão, atletas e treinos ficam só neste navegador, sem servidor.
const SESSION_KEY = "baseline.demo.session";
const DATA_KEY = "baseline.demo.data";
const DEMO_GUARDIAN_ID = "demo-guardian";

interface DemoData {
  athletes: Athlete[];
  consents: Consent[];
  sessions: TrainingSession[];
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sem armazenamento (aba anônima): a demonstração segue só na memória desta visita.
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignorado pelo mesmo motivo acima
  }
}

export function demoSession(): Session | null {
  return read<Session | null>(SESSION_KEY, null);
}

export function demoSignIn(email: string): Session {
  const session = {
    access_token: "demo",
    refresh_token: "demo",
    token_type: "bearer",
    expires_in: 3600,
    user: {
      id: DEMO_GUARDIAN_ID,
      email,
      aud: "authenticated",
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  } as unknown as Session;
  write(SESSION_KEY, session);
  return session;
}

export function demoSignOut(): void {
  remove(SESSION_KEY);
}

export function demoDeleteAccount(): void {
  remove(SESSION_KEY);
  remove(DATA_KEY);
}

export function demoLoad(): DemoData {
  const data = read<Partial<DemoData>>(DATA_KEY, {});
  return { athletes: data.athletes ?? [], consents: data.consents ?? [], sessions: data.sessions ?? [] };
}

export function demoCreateAthlete(guardianId: string, input: NewAthleteInput): Athlete {
  const age = ageThisYear(input.birthYear);
  if (age < MIN_AGE || age > MAX_AGE) throw new Error("idade fora da faixa de 6 a 17 anos");
  const data = demoLoad();
  const now = new Date().toISOString();
  const athlete: Athlete = {
    id: crypto.randomUUID(),
    guardian_id: guardianId,
    nickname: input.nickname,
    birth_year: input.birthYear,
    level: input.level,
    position: input.position,
    created_at: now,
  };
  data.athletes.push(athlete);
  data.consents.unshift({ id: crypto.randomUUID(), athlete_id: athlete.id, document_version: CONSENT_VERSION, accepted_at: now, revoked_at: null });
  write(DATA_KEY, data);
  return athlete;
}

export function demoCreateSession(guardianId: string, input: NewSessionInput): TrainingSession {
  const data = demoLoad();
  const session: TrainingSession = {
    id: crypto.randomUUID(),
    guardian_id: guardianId,
    athlete_id: input.athleteId,
    program_id: input.programId,
    performed_on: localIsoDate(),
    minutes: input.minutes,
    drills_done: input.drillsDone,
    drills_total: input.drillsTotal,
    feeling: input.feeling,
    discomfort: input.discomfort,
    created_at: new Date().toISOString(),
  };
  data.sessions.unshift(session);
  write(DATA_KEY, data);
  return session;
}
