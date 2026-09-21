import { describe, expect, it } from "vitest";
import { addDaysIso, achievements, bestGoalStreak, fundamentalsProgress, goalStreak, isTestDue, lastWeeks, nextTestDate, testProgress } from "./progress";
import type { SkillTestDef, SkillTestRecord, TrainingSession } from "./types";

// Sexta-feira 11 de setembro de 2026.
const TODAY = new Date(2026, 8, 11);
// Segunda-feira da semana corrente.
const MONDAY = "2026-09-07";

const session = (date: string, minutes = 20): TrainingSession => ({
  id: `${date}-${minutes}`,
  guardian_id: "g1",
  athlete_id: "a1",
  program_id: "p1",
  performed_on: date,
  minutes,
  drills_done: 4,
  drills_total: 4,
  feeling: null,
  discomfort: false,
  created_at: `${date}T12:00:00Z`,
});

describe("lastWeeks", () => {
  it("agrupa treinos por semana de segunda a domingo", () => {
    const weeks = lastWeeks([session(MONDAY), session("2026-09-08"), session("2026-09-05")], 2, TODAY);
    expect(weeks).toHaveLength(2);
    expect(weeks[0]).toMatchObject({ start: "2026-08-31", sessions: 1 });
    expect(weeks[1]).toMatchObject({ start: MONDAY, sessions: 2, minutes: 40 });
  });

  it("semana sem treino aparece zerada", () => {
    const weeks = lastWeeks([], 3, TODAY);
    expect(weeks.map((w) => w.sessions)).toEqual([0, 0, 0]);
  });
});

describe("goalStreak", () => {
  it("semana atual incompleta não zera a sequência", () => {
    const sessions = [
      session("2026-08-31"),
      session("2026-09-01"),
      session(MONDAY), // semana atual com só 1 de meta 2
    ];
    expect(goalStreak(sessions, 2, TODAY)).toBe(1);
  });

  it("conta semanas seguidas com a meta cumprida", () => {
    const sessions = [
      session("2026-08-24"),
      session("2026-08-25"),
      session("2026-08-31"),
      session("2026-09-01"),
    ];
    expect(goalStreak(sessions, 2, TODAY)).toBe(2);
  });

  it("semana com falta no meio corta a sequência", () => {
    const sessions = [session("2026-08-24"), session("2026-08-31"), session("2026-09-01")];
    expect(goalStreak(sessions, 2, TODAY)).toBe(1);
  });
});

describe("bestGoalStreak", () => {
  it("guarda a melhor sequência, mesmo com quebras no meio", () => {
    const sessions = [
      session("2026-07-27"),
      session("2026-08-03"),
      session("2026-08-04"),
      session("2026-08-10"),
      session("2026-08-11"),
    ];
    expect(bestGoalStreak(sessions, 1)).toBe(3);
  });
});

describe("testes de habilidade", () => {
  const def: SkillTestDef = {
    id: "lance-livre",
    name: "Lances livres",
    unit: "de 10",
    better: "max",
    bands: ["15-17"],
    protocol: "",
    min: 0,
    max: 10,
    step: "int",
  };
  const record = (date: string, value: number): SkillTestRecord => ({
    id: date,
    guardian_id: "g1",
    athlete_id: "a1",
    tested_on: date,
    results: { "lance-livre": value },
    created_at: `${date}T12:00:00Z`,
  });

  it("próxima bateria é 28 dias depois da última", () => {
    expect(nextTestDate([record("2026-09-01", 5)])).toBe("2026-09-29");
  });

  it("sem testes, a bateria está vazia (devida)", () => {
    expect(isTestDue([], "2026-09-11")).toBe(true);
  });

  it("testes antes da data não estão devidos", () => {
    expect(isTestDue([record("2026-09-01", 5)], "2026-09-11")).toBe(false);
  });

  it("evolução compara o primeiro com o último resultado", () => {
    const progress = testProgress(def, [record("2026-09-01", 5), record("2026-08-04", 3)]);
    expect(progress.last).toBe(5);
    expect(progress.best).toBe(5);
    expect(progress.improved).toBe(true);
  });

  it("piorou não marca evolução", () => {
    const progress = testProgress(def, [record("2026-09-01", 3), record("2026-08-04", 5)]);
    expect(progress.improved).toBe(false);
  });

  it("marcas de tempo: menor é melhor", () => {
    const timeDef = { ...def, better: "min" as const };
    const progress = testProgress(timeDef, [record("2026-09-01", 17.2), record("2026-08-04", 18.4)]);
    expect(progress.best).toBe(17.2);
    expect(progress.improved).toBe(true);
  });
});

describe("mapa de fundamentos", () => {
  const dribbleTest: SkillTestDef = {
    id: "mao-fraca-30s",
    name: "Mão fraca",
    unit: "dribles",
    better: "max",
    bands: ["15-17"],
    protocol: "",
    min: 0,
    max: 150,
    step: "int",
  };
  const record = (date: string, value: number): SkillTestRecord => ({
    id: date,
    guardian_id: "g1",
    athlete_id: "a1",
    tested_on: date,
    results: { "mao-fraca-30s": value },
    created_at: `${date}T12:00:00Z`,
  });

  it("separa treinos por fundamento e calcula recência e minutos", () => {
    const map = fundamentalsProgress(
      [
        { ...session("2026-09-10", 8), id: "d1", program_id: "mao-fraca" },
        { ...session("2026-08-01", 12), id: "d2", program_id: "mao-fraca" },
        { ...session("2026-09-09", 6), id: "a1", program_id: "arremesso-base" },
      ],
      [],
      [dribbleTest],
      "2026-09-11",
    );

    expect(map.find((item) => item.category === "drible")).toMatchObject({
      sessions: 2,
      recentSessions: 1,
      minutes: 20,
      lastTrained: "2026-09-10",
    });
    expect(map.find((item) => item.category === "arremesso")).toMatchObject({ sessions: 1, minutes: 6 });
    expect(map.find((item) => item.category === "passe")).toMatchObject({ sessions: 0, lastTrained: null });
  });

  it("leva a evolução dos testes ao fundamento correspondente", () => {
    const map = fundamentalsProgress(
      [],
      [record("2026-09-01", 24), record("2026-08-04", 18)],
      [dribbleTest],
      "2026-09-11",
    );
    expect(map.find((item) => item.category === "drible")).toMatchObject({
      tested: true,
      improved: true,
      availableTests: 1,
    });
    expect(map.find((item) => item.category === "fisico")).toMatchObject({ tested: false, availableTests: 0 });
  });
});

describe("achievements", () => {
  const defs: SkillTestDef[] = [];

  it("primeiro treino desbloqueia as conquistas básicas", () => {
    const badges = achievements([session(MONDAY)], [], 1, defs, TODAY);
    const byId = Object.fromEntries(badges.map((b) => [b.id, b.earned]));
    expect(byId["primeiro-treino"]).toBe(true);
    expect(byId["ate-o-fim"]).toBe(true); // 4/4 exercícios
    expect(byId["5-treinos"]).toBe(false);
  });

  it("conquista de minutos usa o mês corrente", () => {
    const thisMonth = achievements([session("2026-09-02", 60)], [], 1, defs, TODAY);
    const lastMonth = achievements([session("2026-08-02", 60)], [], 1, defs, TODAY);
    expect(thisMonth.find((b) => b.id === "60-minutos")?.earned).toBe(true);
    expect(lastMonth.find((b) => b.id === "60-minutos")?.earned).toBe(false);
  });
});

describe("addDaysIso", () => {
  it("soma dias em data local", () => {
    expect(addDaysIso("2026-09-01", 28)).toBe("2026-09-29");
    expect(addDaysIso("2026-09-07", -7)).toBe("2026-08-31");
  });
});
