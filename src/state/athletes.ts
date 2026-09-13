import { useCallback, useEffect, useState } from "react";
import { isDemo, requireSupabase } from "../lib/supabase";
import { demoAuthorize, demoCreateAthlete, demoCreateSelf, demoDeleteAthlete, demoLoad, demoRevoke, demoUpdateAthlete } from "../lib/demo";
import { CONSENT_VERSION, consentVersionFor } from "../lib/consent";
import type { Athlete, AthletePatch, Consent, NewAthleteInput } from "../lib/types";

export function useAthletes(guardianId: string) {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // `loading` só vale para a primeira carga: recarregar depois de salvar não pode trocar a tela
  // pela de carregamento (a tela aberta seria desmontada no meio da edição).
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
      setError("Não foi possível carregar os perfis. Confira a internet e tente de novo.");
    } else {
      setAthletes((athletesRes.data as Athlete[]).map((a) => ({ ...a, is_self: Boolean(a.is_self) })));
      setConsents(consentsRes.data as Consent[]);
      setError(null);
    }
    setLoading(false);
  }, [guardianId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Perfil e aceite são gravados juntos pela função do banco: nunca existe perfil sem aceite.
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

  const createSelf = useCallback(
    async (input: NewAthleteInput): Promise<Athlete> => {
      if (isDemo) {
        const athlete = demoCreateSelf(guardianId, input);
        await reload();
        return athlete;
      }
      const version = consentVersionFor({ is_self: true, birth_year: input.birthYear });
      const { data, error: rpcError } = await requireSupabase().rpc("create_self_profile_with_consent", {
        p_nickname: input.nickname,
        p_birth_year: input.birthYear,
        p_level: input.level,
        p_position: input.position,
        p_document_version: version,
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

  // Revogar não apaga nada: o perfil fica bloqueado até novo aceite ou exclusão.
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

  // Novo aceite é um registro novo: o histórico de aceites e revogações fica preservado.
  const authorize = useCallback(
    async (athlete: Athlete): Promise<void> => {
      const documentVersion = consentVersionFor(athlete);
      if (isDemo) {
        demoAuthorize(athlete.id, documentVersion);
      } else {
        const { error: insertError } = await requireSupabase().from("consents").insert({
          guardian_id: guardianId,
          athlete_id: athlete.id,
          document_version: documentVersion,
          guardian_declaration: true,
        });
        if (insertError) throw insertError;
      }
      await reload();
    },
    [guardianId, reload],
  );

  // Apaga o perfil; aceites, treinos e testes saem junto (on delete cascade no banco).
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

  return { athletes, consents, loading, error, reload, create, createSelf, update, revoke, authorize, remove };
}
