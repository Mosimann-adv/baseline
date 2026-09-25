import { createLogHook } from "./createLog";
import { demoCreateSession, demoLoad } from "../lib/demo";
import { mergeSessions, newQueuedSession, sessionRow, type QueuedSession } from "../lib/offlineQueue";
import type { NewSessionInput, TrainingSession } from "../lib/types";

/** Treinos registrados por todos os atletas do responsável, do mais recente para o mais antigo. */
const useSessionLog = createLogHook<TrainingSession, NewSessionInput, QueuedSession>({
  table: "training_sessions",
  orderColumn: "performed_on",
  limit: 300,
  loadError: "Não foi possível carregar os treinos. Confira a internet e tente de novo.",
  demoList: (guardianId) => demoLoad().sessions.filter((s) => s.guardian_id === guardianId),
  demoCreate: demoCreateSession,
  newQueued: newQueuedSession,
  toRow: sessionRow,
  mergePending: mergeSessions,
});

export function useSessions(guardianId: string) {
  const log = useSessionLog(guardianId);
  return { ...log, sessions: log.rows };
}
