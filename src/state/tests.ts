import { useCallback, useEffect, useState } from "react";
import { isDemo, requireSupabase } from "../lib/supabase";
import { demoCreateTest, demoLoad } from "../lib/demo";
import { isDuplicateKey, isNetworkError, isRlsError } from "../lib/errors";
import { dropFromQueue, enqueue, flushQueue, mergeTests, newQueuedTest } from "../lib/offlineQueue";
import type { NewTestInput, SkillTestRecord } from "../lib/types";

/** Baterias de testes de todos os atletas do responsável, da mais recente para a mais antiga. */
export function useTests(guardianId: string) {
  const [tests, setTests] = useState<SkillTestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (isDemo) {
      setTests(demoLoad().tests.filter((t) => t.guardian_id === guardianId));
      setError(null);
      setLoading(false);
      return;
    }
    const { data, error: queryError } = await requireSupabase()
      .from("skill_tests")
      .select("*")
      .eq("guardian_id", guardianId)
      .order("tested_on", { ascending: false })
      .order("created_at", { ascending: false });
    if (queryError) setError("Não foi possível carregar os testes. Confira a internet e tente de novo.");
    else {
      const server = data as SkillTestRecord[];
      for (const row of server) dropFromQueue(guardianId, row.id);
      setTests(mergeTests(guardianId, server));
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
    async (input: NewTestInput): Promise<void> => {
      if (isDemo) {
        demoCreateTest(guardianId, input);
        await reload();
        return;
      }
      const item = newQueuedTest(guardianId, input);
      try {
        const { error: insertError } = await requireSupabase().from("skill_tests").insert({
          id: item.id,
          guardian_id: guardianId,
          athlete_id: input.athleteId,
          tested_on: item.testedOn,
          results: input.results,
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

  return { tests, loading, error, reload, create, sync };
}
