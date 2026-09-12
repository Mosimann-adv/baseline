import { useCallback, useEffect, useState } from "react";
import { isDemo, requireSupabase } from "../lib/supabase";
import { demoCreateTest, demoLoad } from "../lib/demo";
import { localIsoDate } from "../lib/dates";
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
      setTests(data as SkillTestRecord[]);
      setError(null);
    }
    setLoading(false);
  }, [guardianId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = useCallback(
    async (input: NewTestInput): Promise<void> => {
      if (isDemo) {
        demoCreateTest(guardianId, input);
      } else {
        const { error: insertError } = await requireSupabase().from("skill_tests").insert({
          guardian_id: guardianId,
          athlete_id: input.athleteId,
          tested_on: localIsoDate(),
          results: input.results,
        });
        if (insertError) throw insertError;
      }
      await reload();
    },
    [guardianId, reload],
  );

  return { tests, loading, error, reload, create };
}
