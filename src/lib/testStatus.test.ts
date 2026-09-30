import { describe, expect, it } from "vitest";
import { latestTestDate, nextTestFor, testIsDue, testsDue } from "./testStatus";
import { SKILL_TESTS } from "../content/tests";
import type { SkillTestRecord } from "./types";

const record = (id: string, testedOn: string, results: Record<string, number>): SkillTestRecord => ({
  id,
  guardian_id: "g1",
  athlete_id: "a1",
  tested_on: testedOn,
  results,
  created_at: testedOn,
});

describe("status de teste individual (28 dias por teste, não por bateria)", () => {
  const records = [
    record("r1", "2026-09-01", { "mao-fraca-30s": 40 }),
    record("r2", "2026-09-20", { "lance-livre": 5 }),
    record("r3", "2026-09-10", { "mao-fraca-30s": 45 }),
  ];

  it("latestTestDate olha só o teste pedido, mesmo com marcas mais recentes de outros testes", () => {
    expect(latestTestDate("mao-fraca-30s", records)).toBe("2026-09-10");
    expect(latestTestDate("lance-livre", records)).toBe("2026-09-20");
    expect(latestTestDate("sprint-10m", records)).toBeNull();
    expect(latestTestDate("sprint-10m", [])).toBeNull();
  });

  it("nextTestFor soma 28 dias à última marca do próprio teste e volta null sem marca", () => {
    expect(nextTestFor("mao-fraca-30s", records)).toBe("2026-10-08");
    expect(nextTestFor("lance-livre", records)).toBe("2026-10-18");
    expect(nextTestFor("sprint-10m", records)).toBeNull();
  });

  it("testIsDue: nunca medido está na hora; dentro da janela não está; vencido está", () => {
    expect(testIsDue("sprint-10m", records, "2026-09-29")).toBe(true);
    expect(testIsDue("lance-livre", records, "2026-10-10")).toBe(false);
    expect(testIsDue("lance-livre", records, "2026-10-18")).toBe(true);
    // Registrar um teste não adia os demais (era o defeito da bateria inteira).
    expect(testIsDue("mao-fraca-30s", records, "2026-09-29")).toBe(false);
  });

  it("testsDue devolve só os vencidos, na ordem recebida", () => {
    const defs = SKILL_TESTS.filter((def) => ["mao-fraca-30s", "lance-livre", "sprint-10m"].includes(def.id));
    expect(testsDue(defs, records, "2026-09-29").map((def) => def.id)).toEqual(["sprint-10m"]);
    expect(testsDue(defs, records, "2026-10-08").map((def) => def.id)).toEqual(["mao-fraca-30s", "sprint-10m"]);
    expect(testsDue(defs, [], "2026-09-29")).toHaveLength(3);
  });
});
