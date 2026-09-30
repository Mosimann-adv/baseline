import { localIsoDate, startOfWeekIso } from "./dates";
import { TEST_INTERVAL_DAYS } from "../content/tests";
import { practiceById } from "../content/practices";
import { goalForWeek, type GoalHistory } from "./goals";
import type { Category, SkillTestDef, SkillTestRecord, TrainingSession } from "./types";

export function addDaysIso(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localIsoDate(date);
}

const weekOf = (iso: string) => startOfWeekIso(new Date(`${iso}T12:00:00`));

export const isCountedPractice = (session: TrainingSession) => session.drills_done > 0;

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
    if (!isCountedPractice(session)) continue;
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
    if (!isCountedPractice(session)) continue;
    const key = weekOf(session.performed_on);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

// Semana atual só conta quando a meta já foi cumprida, para a sequência não zerar no meio da semana.
export function goalStreak(sessions: TrainingSession[], goal: number, today = new Date(), history?: GoalHistory): number {
  const counts = sessionsPerWeek(sessions);
  let week = startOfWeekIso(today);
  if ((counts.get(week) ?? 0) < goalForWeek(history, week, goal)) week = addDaysIso(week, -7);
  let streak = 0;
  while ((counts.get(week) ?? 0) >= goalForWeek(history, week, goal)) {
    streak += 1;
    week = addDaysIso(week, -7);
  }
  return streak;
}

export function bestGoalStreak(sessions: TrainingSession[], goal: number, history?: GoalHistory): number {
  const metWeeks = [...sessionsPerWeek(sessions)].filter(([week, count]) => count >= goalForWeek(history, week, goal)).map(([week]) => week).sort();
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

const FUNDAMENTAL_ORDER: Category[] = ["drible", "arremesso", "passe", "defesa", "fisico"];

const TESTS_BY_FUNDAMENTAL: Record<Category, readonly string[]> = {
  drible: ["mao-fraca-30s", "zigue-zague"],
  arremesso: ["arremessos-perto", "lance-livre", "arremessos-1min"],
  passe: [],
  defesa: [],
  fisico: ["sprint-10m", "salto-vertical"],
};

export interface FundamentalProgress {
  category: Category;
  sessions: number;
  recentSessions: number;
  minutes: number;
  lastTrained: string | null;
  tested: boolean;
  improved: boolean;
  availableTests: number;
}

/**
 * Resume a prática de cada fundamento sem transformar frequência em nota de
 * habilidade. `recentSessions` considera os últimos 28 dias, a mesma janela
 * usada entre baterias de testes.
 */
export function fundamentalsProgress(
  sessions: TrainingSession[],
  tests: SkillTestRecord[],
  testDefs: SkillTestDef[],
  today = localIsoDate(),
): FundamentalProgress[] {
  const recentStart = addDaysIso(today, -(TEST_INTERVAL_DAYS - 1));

  return FUNDAMENTAL_ORDER.map((category) => {
    const ofCategory = sessions.filter((session) => isCountedPractice(session) && (session.execution
      ? session.execution.blocks.some((block) => block.category === category && block.done > 0)
      : practiceById(session.program_id)?.category === category));
    const relatedDefs = testDefs.filter((def) => TESTS_BY_FUNDAMENTAL[category].includes(def.id));
    const relatedProgress = relatedDefs.map((def) => testProgress(def, tests));

    return {
      category,
      sessions: ofCategory.length,
      recentSessions: ofCategory.filter((session) => session.performed_on >= recentStart && session.performed_on <= today).length,
      minutes: Math.round(ofCategory.reduce((total, session) => total + (session.execution
        ? session.execution.blocks.filter((block) => block.category === category && block.done > 0).reduce((sum, block) => sum + block.seconds, 0) / 60
        : session.minutes), 0)),
      lastTrained: ofCategory.reduce<string | null>(
        (last, session) => (last === null || session.performed_on > last ? session.performed_on : last),
        null,
      ),
      tested: relatedProgress.some((progress) => progress.last !== null),
      improved: relatedProgress.some((progress) => progress.improved),
      availableTests: relatedDefs.length,
    };
  });
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earned: boolean;
}

export function achievements(sessions: TrainingSession[], tests: SkillTestRecord[], goal: number, testDefs: SkillTestDef[], today = new Date(), history?: GoalHistory, permanent: readonly string[] = []): Achievement[] {
  const counted = sessions.filter(isCountedPractice);
  const total = counted.length;
  const bestStreak = bestGoalStreak(counted, goal, history);
  const months = new Map<string, number>();
  for (const session of counted.filter((s) => s.performed_on <= localIsoDate(today))) {
    const month = session.performed_on.slice(0, 7);
    months.set(month, (months.get(month) ?? 0) + session.minutes);
  }

  const badges: Achievement[] = [
    { id: "primeiro-treino", title: "Primeiro treino", description: "Terminou o primeiro treino.", earned: total >= 1 },
    { id: "ate-o-fim", title: "Até o fim", description: "Fez todos os exercícios de uma prática.", earned: counted.some((s) => s.drills_done === s.drills_total) },
    { id: "5-treinos", title: "5 treinos", description: "Somou 5 treinos registrados.", earned: total >= 5 },
    { id: "20-treinos", title: "20 treinos", description: "Somou 20 treinos registrados.", earned: total >= 20 },
    { id: "semana-cheia", title: "Semana cheia", description: "Cumpriu a meta de uma semana.", earned: bestStreak >= 1 },
    { id: "3-semanas", title: "3 semanas seguidas", description: "Cumpriu a meta 3 semanas seguidas.", earned: bestStreak >= 3 },
    { id: "60-minutos", title: "60 minutos em um mês", description: "Somou 60 minutos em um mês. Esta conquista continua sua.", earned: [...months.values()].some((minutes) => minutes >= 60) },
    { id: "primeiro-teste", title: "Primeiro teste", description: "Fez a primeira bateria de testes.", earned: tests.length >= 1 },
    { id: "evoluiu", title: "Evoluiu", description: "Melhorou a própria marca em um teste.", earned: testDefs.some((def) => {
      const progress = testProgress(def, tests);
      const first = progress.points[0]?.value;
      return first !== undefined && progress.best !== null && (def.better === "max" ? progress.best > first : progress.best < first);
    }) },
  ];
  return badges.map((badge) => ({ ...badge, earned: badge.earned || permanent.includes(badge.id) }));
}
