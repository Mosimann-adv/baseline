import { demoLoad } from "./demo";
import { queuedSessions, queuedTests } from "./offlineQueue";
import { isDemo, requireSupabase } from "./supabase";

/** Contagem real no banco (não o recorte de 300 treinos da tela). Inclui a fila ainda não enviada. */
export async function countAthleteRows(
  guardianId: string,
  athleteId: string,
): Promise<{ sessions: number; tests: number }> {
  if (isDemo) {
    const data = demoLoad();
    return {
      sessions: data.sessions.filter((row) => row.athlete_id === athleteId).length,
      tests: data.tests.filter((row) => row.athlete_id === athleteId).length,
    };
  }
  const client = requireSupabase();
  const [sessions, tests] = await Promise.all([
    client.from("training_sessions").select("id", { count: "exact", head: true }).eq("guardian_id", guardianId).eq("athlete_id", athleteId),
    client.from("skill_tests").select("id", { count: "exact", head: true }).eq("guardian_id", guardianId).eq("athlete_id", athleteId),
  ]);
  return {
    sessions: (sessions.count ?? 0) + queuedSessions(guardianId, athleteId).length,
    tests: (tests.count ?? 0) + queuedTests(guardianId, athleteId).length,
  };
}
