import { useCallback, useEffect, useState } from "react";
import { isDemo, requireSupabase } from "../lib/supabase";
import { demoCreateSession, demoLoad } from "../lib/demo";
import { isDuplicateKey, isNetworkError, isRlsError } from "../lib/errors";
import { dropFromQueue, enqueue, flushQueue, mergeSessions, newQueuedSession } from "../lib/offlineQueue";
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
      const server = data as TrainingSession[];
      for (const row of server) dropFromQueue(guardianId, row.id);
      setSessions(mergeSessions(guardianId, server));
      setError(null);
    }
    setLoading(false);
  }, [guardianId]);

  const sync = useCallback(async () => {
    if (isDemo) return;
    await flushQueue(guardianId);
    await reload();
  }, [guardianId, reload]);

  useEffect(() => {
    void reload().then(() => {
      if (!isDemo) void flushQueue(guardianId).then(() => void reload());
    });
  }, [reload, guardianId]);

  useEffect(() => {
    if (isDemo) return;
    const onOnline = () => void sync();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [sync]);

  const create = useCallback(
    async (input: NewSessionInput): Promise<void> => {
      if (isDemo) {
        demoCreateSession(guardianId, input);
        await reload();
        return;
      }
      const item = newQueuedSession(guardianId, input);
      try {
        const { error: insertError } = await requireSupabase().from("training_sessions").insert({
          id: item.id,
          guardian_id: guardianId,
          athlete_id: input.athleteId,
          program_id: input.programId,
          performed_on: item.performedOn,
          minutes: input.minutes,
          drills_done: input.drillsDone,
          drills_total: input.drillsTotal,
          feeling: input.feeling,
          discomfort: input.discomfort,
        });
        if (insertError) {
          if (isDuplicateKey(insertError)) {
            await reload();
            return;
          }
          if (isNetworkError(insertError)) {
            enqueue(item);
            await reload();
            return;
          }
          if (isRlsError(insertError)) {
            enqueue({ ...item, blocked: true, lastError: "Este perfil está sem aceite ativo. Dê o consentimento ou a autorização de novo na tela Conta." });
            throw insertError;
          }
          throw insertError;
        }
      } catch (err) {
        if (isNetworkError(err)) {
          enqueue(item);
          await reload();
          return;
        }
        throw err;
      }
      await reload();
    },
    [guardianId, reload],
  );

  return { sessions, loading, error, reload, create, sync };
}
