import { localIsoDate } from "./dates";
import { addDaysIso } from "./progress";
import { TEST_INTERVAL_DAYS } from "../content/tests";
import type { SkillTestDef, SkillTestRecord } from "./types";

/** Data da marca mais recente de UM teste (null se nunca mediu). Ignora as marcas dos outros testes. */
export function latestTestDate(testId: string, records: SkillTestRecord[]): string | null {
  let latest: string | null = null;
  for (const record of records) {
    if (typeof record.results[testId] !== "number") continue;
    if (latest === null || record.tested_on > latest) latest = record.tested_on;
  }
  return latest;
}

/** Próxima data em que o teste pode ser medido de novo (28 dias após a própria última marca). Null = nunca mediu. */
export function nextTestFor(testId: string, records: SkillTestRecord[]): string | null {
  const latest = latestTestDate(testId, records);
  return latest === null ? null : addDaysIso(latest, TEST_INTERVAL_DAYS);
}

/** O teste está na hora? Nunca mediu, ou a janela de 28 dias da marca dele já fechou. */
export function testIsDue(testId: string, records: SkillTestRecord[], today = localIsoDate()): boolean {
  const next = nextTestFor(testId, records);
  return next === null || next <= today;
}

/** Testes que estão na hora, na ordem recebida — um por teste, sem adiar a bateria inteira. */
export function testsDue(defs: SkillTestDef[], records: SkillTestRecord[], today = localIsoDate()): SkillTestDef[] {
  return defs.filter((def) => testIsDue(def.id, records, today));
}
