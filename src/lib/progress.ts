import { localIsoDate, startOfWeekIso } from "./dates";
import { TEST_INTERVAL_DAYS } from "../content/tests";
import type { SkillTestDef, SkillTestRecord, TrainingSession } from "./types";

export function addDaysIso(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localIsoDate(date);
}

const weekOf = (iso: string) => startOfWeekIso(new Date(`${iso}T12:00:00`));

export interface WeekSummary {
  start: string;
  sessions: number;
  minutes: number;
}

/** As últimas `count` semanas (segunda a domingo), da mais antiga para a atual. */
export function lastWeeks(sessions: TrainingSession[], count: number, today = new Date()): WeekSummary[] {
  const current = startOfWeekIso(today);
  const weeks = Array.from({ length: count }, (_, i) => ({ start: addDaysIso(current, -7 * (count - 1 - i)), sessions: 0, minutes: 0 }));
  const byStart = new Map(weeks.map((week) => [week.start, week]));
  for (const session of sessions) {
    const week = byStart.get(weekOf(session.performed_on));
    if (week) {
      week.sessions += 1;
      week.minutes += session.minutes;
    }
  }
  return weeks;
}

function sessionsPerWeek(sessions: TrainingSession[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    const key = weekOf(session.performed_on);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

// Semana atual só conta quando a meta já foi cumprida, para a sequência não zerar no meio da semana.
export function goalStreak(sessions: TrainingSession[], goal: number, today = new Date()): number {
  const counts = sessionsPerWeek(sessions);
  let week = startOfWeekIso(today);
  if ((counts.get(week) ?? 0) < goal) week = addDaysIso(week, -7);
  let streak = 0;
  while ((counts.get(week) ?? 0) >= goal) {
    streak += 1;
    week = addDaysIso(week, -7);
  }
  return streak;
}

export function bestGoalStreak(sessions: TrainingSession[], goal: number): number {
  const metWeeks = [...sessionsPerWeek(sessions)].filter(([, count]) => count >= goal).map(([week]) => week).sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const week of metWeeks) {
    run = previous !== null && addDaysIso(previous, 7) === week ? run + 1 : 1;
    best = Math.max(best, run);
    previous = week;
  }
  return best;
}

/** Testes ordenados do mais recente para o mais antigo. */
export function nextTestDate(tests: SkillTestRecord[]): string | null {
  return tests.length > 0 ? addDaysIso(tests[0].tested_on, TEST_INTERVAL_DAYS) : null;
}

export function isTestDue(tests: SkillTestRecord[], today = localIsoDate()): boolean {
  const next = nextTestDate(tests);
  return next === null || next <= today;
}

export interface TestProgress {
  points: { date: string; value: number }[];
  best: number | null;
  last: number | null;
  improved: boolean;
}

export function testProgress(test: SkillTestDef, tests: SkillTestRecord[]): TestProgress {
  const points = [...tests]
    .reverse()
    .filter((record) => typeof record.results[test.id] === "number")
    .map((record) => ({ date: record.tested_on, value: record.results[test.id] }));
  if (points.length === 0) return { points, best: null, last: null, improved: false };
  const values = points.map((point) => point.value);
  const first = values[0];
  const last = values[values.length - 1];
  return {
    points,
    best: test.better === "max" ? Math.max(...values) : Math.min(...values),
    last,
    improved: points.length > 1 && (test.better === "max" ? last > first : last < first),
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earned: boolean;
}

export function achievements(sessions: TrainingSession[], tests: SkillTestRecord[], goal: number, testDefs: SkillTestDef[], today = new Date()): Achievement[] {
  const total = sessions.length;
  const bestStreak = bestGoalStreak(sessions, goal);
  const monthStart = localIsoDate(new Date(today.getFullYear(), today.getMonth(), 1));
  const monthMinutes = sessions.filter((s) => s.performed_on >= monthStart).reduce((sum, s) => sum + s.minutes, 0);

  return [
    { id: "primeiro-treino", title: "Primeiro treino", description: "Terminou o primeiro treino.", earned: total >= 1 },
    { id: "ate-o-fim", title: "Até o fim", description: "Fez todos os exercícios de um treino.", earned: sessions.some((s) => s.drills_done === s.drills_total) },
    { id: "5-treinos", title: "5 treinos", description: "Somou 5 treinos registrados.", earned: total >= 5 },
    { id: "20-treinos", title: "20 treinos", description: "Somou 20 treinos registrados.", earned: total >= 20 },
    { id: "semana-cheia", title: "Semana cheia", description: "Cumpriu a meta de uma semana.", earned: bestStreak >= 1 },
    { id: "3-semanas", title: "3 semanas seguidas", description: "Cumpriu a meta 3 semanas seguidas.", earned: bestStreak >= 3 },
    { id: "60-minutos", title: "60 minutos no mês", description: "Treinou 60 minutos neste mês.", earned: monthMinutes >= 60 },
    { id: "primeiro-teste", title: "Primeiro teste", description: "Fez a primeira bateria de testes.", earned: tests.length >= 1 },
    { id: "evoluiu", title: "Evoluiu", description: "Melhorou a própria marca em um teste.", earned: testDefs.some((def) => testProgress(def, tests).improved) },
  ];
}
