import { useCallback, useEffect, useState } from "react";
import { isDemo, requireSupabase } from "../lib/supabase";
import { demoAuthorize, demoCreateAthlete, demoDeleteAthlete, demoLoad, demoRevoke, demoUpdateAthlete } from "../lib/demo";
import { CONSENT_VERSION } from "../lib/consent";
import type { Athlete, AthletePatch, Consent, NewAthleteInput } from "../lib/types";

export function useAthletes(guardianId: string) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // `loading` só vale para a primeira carga: recarregar depois de salvar não pode trocar a tela
  // pela de carregamento (isso trancava de novo a Área do responsável).
  const reload = useCallback(async () => {
    if (isDemo) {
      const data = demoLoad();
      setAthletes(data.athletes.filter((a) => a.guardian_id === guardianId));
      setConsents(data.consents);
      setError(null);
      setLoading(false);
      return;
    }
    const client = requireSupabase();
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
      if (isDemo) {
        const athlete = demoCreateAthlete(guardianId, input);
        await reload();
        return athlete;
      }
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
    [guardianId, reload],
  );

  const update = useCallback(
    async (athleteId: string, patch: AthletePatch): Promise<void> => {
      if (isDemo) {
        demoUpdateAthlete(athleteId, patch);
      } else {
        const { error: updateError } = await requireSupabase().from("athletes").update(patch).eq("id", athleteId);
        if (updateError) throw updateError;
      }
      await reload();
    },
    [reload],
  );

  // Revogar não apaga nada: o perfil fica bloqueado até nova autorização ou exclusão.
  const revoke = useCallback(
    async (athleteId: string): Promise<void> => {
      if (isDemo) {
        demoRevoke(athleteId);
      } else {
        const { error: updateError } = await requireSupabase()
          .from("consents")
          .update({ revoked_at: new Date().toISOString() })
          .eq("athlete_id", athleteId)
          .is("revoked_at", null);
        if (updateError) throw updateError;
      }
      await reload();
    },
    [reload],
  );

  // Nova autorização é um registro novo: o histórico de aceites e revogações fica preservado.
  const authorize = useCallback(
    async (athleteId: string): Promise<void> => {
      if (isDemo) {
        demoAuthorize(athleteId);
      } else {
        const { error: insertError } = await requireSupabase().from("consents").insert({
          guardian_id: guardianId,
          athlete_id: athleteId,
          document_version: CONSENT_VERSION,
          guardian_declaration: true,
        });
        if (insertError) throw insertError;
      }
      await reload();
    },
    [guardianId, reload],
  );

  // Apaga o perfil; autorizações, treinos e testes saem junto (on delete cascade no banco).
  const remove = useCallback(
    async (athleteId: string): Promise<void> => {
      if (isDemo) {
        demoDeleteAthlete(athleteId);
      } else {
        const { error: deleteError } = await requireSupabase().from("athletes").delete().eq("id", athleteId);
        if (deleteError) throw deleteError;
      }
      await reload();
    },
    [reload],
  );

  return { athletes, consents, loading, error, reload, create, update, revoke, authorize, remove };
}
