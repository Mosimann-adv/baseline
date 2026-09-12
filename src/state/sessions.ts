import { useCallback, useEffect, useState } from "react";
import { isDemo, requireSupabase } from "../lib/supabase";
import { demoCreateSession, demoLoad } from "../lib/demo";
import { localIsoDate } from "../lib/dates";
import type { NewSessionInput, TrainingSession } from "../lib/types";

/** Treinos registrados por todos os atletas do responsável, do mais recente para o mais antigo. */
export function useSessions(guardianId: string) {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (isDemo) {
      setSessions(demoLoad().sessions.filter((s) => s.guardian_id === guardianId));
      setError(null);
      setLoading(false);
      return;
    }
    const { data, error: queryError } = await requireSupabase()
      .from("training_sessions")
      .select("*")
      .eq("guardian_id", guardianId)
      .order("performed_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(300);
    if (queryError) setError("Não foi possível carregar os treinos. Confira a internet e tente de novo.");
    else {
      setSessions(data as TrainingSession[]);
      setError(null);
    }
    setLoading(false);
  }, [guardianId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = useCallback(
    async (input: NewSessionInput): Promise<void> => {
      if (isDemo) {
        demoCreateSession(guardianId, input);
      } else {
        const { error: insertError } = await requireSupabase().from("training_sessions").insert({
          guardian_id: guardianId,
          athlete_id: input.athleteId,
          program_id: input.programId,
          performed_on: localIsoDate(),
          minutes: input.minutes,
          drills_done: input.drillsDone,
          drills_total: input.drillsTotal,
          feeling: input.feeling,
          discomfort: input.discomfort,
        });
        if (insertError) throw insertError;
      }
      await reload();
    },
    [guardianId, reload],
  );

  return { sessions, loading, error, reload, create };
}
