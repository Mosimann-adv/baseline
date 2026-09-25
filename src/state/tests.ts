import { createLogHook } from "./createLog";
import { demoCreateTest, demoLoad } from "../lib/demo";
import { mergeTests, newQueuedTest, testRow, type QueuedTest } from "../lib/offlineQueue";
import type { NewTestInput, SkillTestRecord } from "../lib/types";

/** Baterias de testes de todos os atletas do responsável, da mais recente para a mais antiga. */
const useTestLog = createLogHook<SkillTestRecord, NewTestInput, QueuedTest>({
  table: "skill_tests",
  orderColumn: "tested_on",
  loadError: "Não foi possível carregar os testes. Confira a internet e tente de novo.",
  demoList: (guardianId) => demoLoad().tests.filter((t) => t.guardian_id === guardianId),
  demoCreate: demoCreateTest,
  newQueued: newQueuedTest,
  toRow: testRow,
  mergePending: mergeTests,
});

export function useTests(guardianId: string) {
  const log = useTestLog(guardianId);
  return { ...log, tests: log.rows };
}
