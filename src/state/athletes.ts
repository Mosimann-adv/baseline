import { useCallback, useEffect, useState } from "react";
import { requireSupabase } from "../lib/supabase";
import { CONSENT_VERSION } from "../lib/consent";
import type { Athlete, Consent, NewAthleteInput } from "../lib/types";

export function useAthletes(guardianId: string) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const client = requireSupabase();
    setLoading(true);
    const [athletesRes, consentsRes] = await Promise.all([
      client.from("athletes").select("*").eq("guardian_id", guardianId).order("created_at"),
      client
        .from("consents")
        .select("id,athlete_id,document_version,accepted_at,revoked_at")
        .eq("guardian_id", guardianId)
        .order("accepted_at", { ascending: false }),
    ]);
    if (athletesRes.error || consentsRes.error) {
      setError("Não foi possível carregar os atletas. Confira a internet e tente de novo.");
    } else {
      setAthletes(athletesRes.data as Athlete[]);
      setConsents(consentsRes.data as Consent[]);
      setError(null);
    }
    setLoading(false);
  }, [guardianId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Atleta e autorização são gravados juntos pela função do banco: nunca existe perfil sem autorização.
  const create = useCallback(
    async (input: NewAthleteInput): Promise<Athlete> => {
      const { data, error: rpcError } = await requireSupabase().rpc("create_athlete_with_consent", {
        p_nickname: input.nickname,
        p_birth_year: input.birthYear,
        p_level: input.level,
        p_position: input.position,
        p_document_version: CONSENT_VERSION,
      });
      if (rpcError) throw rpcError;
      await reload();
      return data as Athlete;
    },
    [reload],
  );

  return { athletes, consents, loading, error, reload, create };
}
