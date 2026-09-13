import type { Session } from "@supabase/supabase-js";
import type { Athlete, AthletePatch, Consent, NewAthleteInput, NewSessionInput, NewTestInput, SkillTestRecord, TrainingSession } from "./types";
import { CONSENT_VERSION, SELF_CONSENT_VERSION, TEEN_CONSENT_VERSION, consentVersionFor } from "./consent";
import { MAX_AGE, MIN_AGE, SELF_MIN_AGE, ageThisYear } from "./age";
import { localIsoDate } from "./dates";
import type { AccountKind } from "./account";

// Modo demonstração: sessão, atletas, treinos e testes ficam só neste navegador, sem servidor.
const SESSION_KEY = "baseline.demo.session";
const DATA_KEY = "baseline.demo.data";
const DEMO_GUARDIAN_ID = "demo-guardian";
const DEFAULT_WEEKLY_GOAL = 3;

interface DemoParent {
  userId: string;
  parentEmail: string;
  code: string;
  confirmed: boolean;
}

interface DemoData {
  athletes: Athlete[];
  consents: Consent[];
  sessions: TrainingSession[];
  tests: SkillTestRecord[];
  parent: DemoParent | null;
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

export function demoSignIn(email: string, meta?: { birthYear?: number; parentEmail?: string; kind?: AccountKind }): Session {
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
      user_metadata: {
        birth_year: meta?.birthYear ?? null,
        parent_email: meta?.parentEmail ?? null,
        account_kind: meta?.kind ?? "adult",
      },
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
  return {
    // Perfis criados antes da meta semanal existir recebem a meta padrão, como faz o banco.
    athletes: (data.athletes ?? []).map((athlete) => ({ ...athlete, weekly_goal: athlete.weekly_goal ?? DEFAULT_WEEKLY_GOAL, is_self: athlete.is_self ?? false })),
    consents: data.consents ?? [],
    sessions: data.sessions ?? [],
    tests: data.tests ?? [],
    parent: data.parent ?? null,
  };
}

export function demoParentStatus(userId: string) {
  const parent = demoLoad().parent;
  if (!parent || parent.userId !== userId) return { parentEmail: null, confirmed: false, code: null };
  return {
    parentEmail: parent.parentEmail,
    confirmed: parent.confirmed,
    code: parent.confirmed ? null : parent.code,
  };
}

export function demoRegisterParent(userId: string, parentEmail: string, code: string) {
  const data = demoLoad();
  data.parent = { userId, parentEmail, code, confirmed: false };
  write(DATA_KEY, data);
  return { parentEmail, confirmed: false, code };
}

export function demoConfirmParent(parentEmail: string, code: string): boolean {
  const data = demoLoad();
  if (!data.parent) return false;
  if (data.parent.parentEmail !== parentEmail.trim().toLowerCase()) return false;
  if (data.parent.code !== code.trim()) return false;
  data.parent = { ...data.parent, confirmed: true };
  write(DATA_KEY, data);
  return true;
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
    weekly_goal: DEFAULT_WEEKLY_GOAL,
    is_self: false,
    created_at: now,
  };
  data.athletes.push(athlete);
  data.consents.unshift({ id: crypto.randomUUID(), athlete_id: athlete.id, document_version: CONSENT_VERSION, accepted_at: now, revoked_at: null });
  write(DATA_KEY, data);
  return athlete;
}

export function demoCreateSelf(guardianId: string, input: NewAthleteInput): Athlete {
  const age = ageThisYear(input.birthYear);
  if (age < SELF_MIN_AGE) throw new Error("perfil proprio exige 16 anos ou mais");
  const data = demoLoad();
  if (data.athletes.some((a) => a.guardian_id === guardianId && a.is_self)) throw new Error("athletes_one_self_per_account");
  const now = new Date().toISOString();
  const athlete: Athlete = {
    id: crypto.randomUUID(),
    guardian_id: guardianId,
    nickname: input.nickname,
    birth_year: input.birthYear,
    level: input.level,
    position: input.position,
    weekly_goal: DEFAULT_WEEKLY_GOAL,
    is_self: true,
    created_at: now,
  };
  const version = consentVersionFor(athlete);
  data.athletes.push(athlete);
  data.consents.unshift({ id: crypto.randomUUID(), athlete_id: athlete.id, document_version: version, accepted_at: now, revoked_at: null });
  write(DATA_KEY, data);
  return athlete;
}

export function demoUpdateAthlete(athleteId: string, patch: AthletePatch): void {
  const data = demoLoad();
  data.athletes = data.athletes.map((athlete) => (athlete.id === athleteId ? { ...athlete, ...patch } : athlete));
  write(DATA_KEY, data);
}

export function demoRevoke(athleteId: string): void {
  const data = demoLoad();
  const now = new Date().toISOString();
  data.consents = data.consents.map((c) => (c.athlete_id === athleteId && !c.revoked_at ? { ...c, revoked_at: now } : c));
  write(DATA_KEY, data);
}

export function demoAuthorize(athleteId: string, documentVersion: string): void {
  const data = demoLoad();
  if (data.consents.some((c) => c.athlete_id === athleteId && c.document_version === documentVersion && !c.revoked_at)) return;
  data.consents.unshift({ id: crypto.randomUUID(), athlete_id: athleteId, document_version: documentVersion, accepted_at: new Date().toISOString(), revoked_at: null });
  write(DATA_KEY, data);
}

export function demoDeleteAthlete(athleteId: string): void {
  const data = demoLoad();
  write(DATA_KEY, {
    athletes: data.athletes.filter((a) => a.id !== athleteId),
    consents: data.consents.filter((c) => c.athlete_id !== athleteId),
    sessions: data.sessions.filter((s) => s.athlete_id !== athleteId),
    tests: data.tests.filter((t) => t.athlete_id !== athleteId),
    parent: data.parent,
  });
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

export function demoCreateTest(guardianId: string, input: NewTestInput): SkillTestRecord {
  const data = demoLoad();
  const record: SkillTestRecord = {
    id: crypto.randomUUID(),
    guardian_id: guardianId,
    athlete_id: input.athleteId,
    tested_on: localIsoDate(),
    results: input.results,
    created_at: new Date().toISOString(),
  };
  data.tests.unshift(record);
  write(DATA_KEY, data);
  return record;
}

/** Pré-carrega uma família de exemplo para explorar o app sem cadastrar. */
export function demoStart(kind: AccountKind): Session {
  const now = new Date().toISOString();
  const year = new Date().getFullYear();
  const adultBirth = year - 36;
  const teenBirth = year - 16;
  const childBirth = year - 10;
  const selfId = crypto.randomUUID();
  const childId = crypto.randomUUID();

  const daysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return localIsoDate(date);
  };

  if (kind === "teen") {
    const self: Athlete = {
      id: selfId,
      guardian_id: DEMO_GUARDIAN_ID,
      nickname: "Dani",
      birth_year: teenBirth,
      level: "iniciante",
      position: "ala",
      weekly_goal: 3,
      is_self: true,
      created_at: now,
    };
    write(DATA_KEY, {
      athletes: [self],
      consents: [{ id: crypto.randomUUID(), athlete_id: selfId, document_version: TEEN_CONSENT_VERSION, accepted_at: now, revoked_at: null }],
      sessions: [],
      tests: [],
      parent: { userId: DEMO_GUARDIAN_ID, parentEmail: "mae@exemplo.com", code: "482193", confirmed: false },
    } satisfies DemoData);
    return demoSignIn("dani@exemplo.com", { birthYear: teenBirth, parentEmail: "mae@exemplo.com", kind: "teen" });
  }

  const self: Athlete = {
    id: selfId,
    guardian_id: DEMO_GUARDIAN_ID,
    nickname: "Rafa",
    birth_year: adultBirth,
    level: "iniciante",
    position: "armador",
    weekly_goal: 3,
    is_self: true,
    created_at: now,
  };
  const child: Athlete = {
    id: childId,
    guardian_id: DEMO_GUARDIAN_ID,
    nickname: "Léo",
    birth_year: childBirth,
    level: "iniciante",
    position: null,
    weekly_goal: 3,
    is_self: false,
    created_at: now,
  };
  const session = (athleteId: string, programId: string, days: number, minutes: number, feeling: 1 | 2 | 3 | 4 | 5): TrainingSession => ({
    id: crypto.randomUUID(),
    guardian_id: DEMO_GUARDIAN_ID,
    athlete_id: athleteId,
    program_id: programId,
    performed_on: daysAgo(days),
    minutes,
    drills_done: 4,
    drills_total: 4,
    feeling,
    discomfort: false,
    created_at: now,
  });
  write(DATA_KEY, {
    athletes: [self, child],
    consents: [
      { id: crypto.randomUUID(), athlete_id: selfId, document_version: SELF_CONSENT_VERSION, accepted_at: now, revoked_at: null },
      { id: crypto.randomUUID(), athlete_id: childId, document_version: CONSENT_VERSION, accepted_at: now, revoked_at: null },
    ],
    sessions: [session(selfId, "mao-fraca", 0, 18, 4), session(selfId, "arremesso-base", 2, 22, 5), session(childId, "drible-duas-maos", 1, 16, 4)],
    tests: [
      {
        id: crypto.randomUUID(),
        guardian_id: DEMO_GUARDIAN_ID,
        athlete_id: selfId,
        tested_on: daysAgo(10),
        results: { "lance-livre": 4, "arremessos-1min": 12, "mao-fraca-30s": 38, "zigue-zague": 18.4, "sprint-10m": 2.3, "salto-vertical": 28 },
        created_at: now,
      },
    ],
    parent: null,
  } satisfies DemoData);
  return demoSignIn("rafa@exemplo.com", { birthYear: adultBirth, kind: "adult" });
}
