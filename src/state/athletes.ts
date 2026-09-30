import { useCallback, useEffect, useRef, useState } from "react";
import { isDemo, requireSupabase } from "../lib/supabase";
import { demoAuthorize, demoCreateAthlete, demoCreateSelf, demoDeleteAthlete, demoLoad, demoRevoke, demoUpdateAthlete } from "../lib/demo";
import { CONSENT_VERSION, consentVersionFor } from "../lib/consent";
import { purgeAthleteFromQueue } from "../lib/offlineQueue";
import { accountCacheBlocked, cacheEpoch, clearProfilePreferences, invalidateAccountReads, readCached, writeCached } from "../lib/cache";
import { clearResume } from "../lib/resumeSession";
import { changedGoalHistory } from "../lib/goals";
import type { Athlete, AthletePatch, Consent, NewAthleteInput } from "../lib/types";

export function useAthletes(guardianId: string) {
  const [cached] = useState(() => isDemo ? null : readCached<{ athletes: Athlete[]; consents: Consent[] }>(guardianId, "family"));
  const [athletes, setAthletes] = useState<Athlete[]>(cached?.athletes ?? []);
  const [consents, setConsents] = useState<Consent[]>(cached?.consents ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const latestLoad = useRef(0);

  // `loading` só vale para a primeira carga: recarregar depois de salvar não pode trocar a tela
  // pela de carregamento (a tela aberta seria desmontada no meio da edição).
  const reload = useCallback(async () => {
    const request = ++latestLoad.current;
    const epoch = cacheEpoch(guardianId);
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
    if (request !== latestLoad.current || epoch !== cacheEpoch(guardianId) || accountCacheBlocked(guardianId)) return;
    if (athletesRes.error || consentsRes.error) {
      setError("Não foi possível carregar os perfis. Confira a internet e tente de novo.");
    } else {
      const cachedFamily = readCached<{ athletes: Athlete[] }>(guardianId, "family");
      const loaded = (athletesRes.data as Athlete[]).map((a) => ({ ...a, is_self: Boolean(a.is_self),
        goal_history: a.goal_history ?? cachedFamily?.athletes.find((previous) => previous.id === a.id)?.goal_history,
        earned_badges: a.earned_badges ?? cachedFamily?.athletes.find((previous) => previous.id === a.id)?.earned_badges }));
      setAthletes(loaded);
      setConsents(consentsRes.data as Consent[]);
      writeCached(guardianId, "family", { athletes: loaded, consents: consentsRes.data }, epoch);
      setError(null);
    }
    setLoading(false);
  }, [guardianId]);

  useEffect(() => {
    void reload();
    const online = () => void reload();
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
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
        if (patch.weekly_goal !== undefined) {
          const family = readCached<{ athletes: Athlete[]; consents: Consent[] }>(guardianId, "family");
          if (family) writeCached(guardianId, "family", { ...family, athletes: family.athletes.map((a) => a.id === athleteId ? {
            ...a, weekly_goal: patch.weekly_goal!, goal_history: changedGoalHistory(a.goal_history, a.weekly_goal, patch.weekly_goal!) } : a) });
        }
        if (patch.earned_badges) {
          const family = readCached<{ athletes: Athlete[]; consents: Consent[] }>(guardianId, "family");
          if (family) writeCached(guardianId, "family", { ...family, athletes: family.athletes.map((a) => a.id === athleteId ? {
            ...a, earned_badges: [...new Set([...(a.earned_badges ?? []), ...patch.earned_badges!])] } : a) });
        }
      }
      await reload();
    },
    [reload],
  );

  // Revogar não apaga nada: o perfil fica bloqueado até novo aceite ou exclusão.
  const revoke = useCallback(
    async (athleteId: string): Promise<void> => {
      const revokedAt = new Date().toISOString();
      if (isDemo) {
        demoRevoke(athleteId);
      } else {
        const { error: updateError } = await requireSupabase()
          .from("consents")
          .update({ revoked_at: revokedAt })
          .eq("athlete_id", athleteId)
          .is("revoked_at", null);
        if (updateError) throw updateError;
        // A revogação já foi confirmada: uma falha na carga seguinte não pode reabrir o perfil.
        invalidateAccountReads(guardianId);
        setConsents((previous) => previous.map((consent) => consent.athlete_id === athleteId && !consent.revoked_at ? { ...consent, revoked_at: revokedAt } : consent));
        const cached = readCached<{ athletes: Athlete[]; consents: Consent[] }>(guardianId, "family");
        if (cached) writeCached(guardianId, "family", { ...cached, consents: cached.consents.map((consent) => consent.athlete_id === athleteId && !consent.revoked_at ? { ...consent, revoked_at: revokedAt } : consent) });
      }
      await reload();
    },
    [guardianId, reload],
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
      // Sem o perfil, a RLS recusaria esses envios para sempre: itens dele saem da fila.
      invalidateAccountReads(guardianId);
      purgeAthleteFromQueue(guardianId, athleteId);
      clearResume(guardianId, athleteId);
      clearProfilePreferences(guardianId, athleteId);
      setAthletes((previous) => previous.filter((athlete) => athlete.id !== athleteId));
      setConsents((previous) => previous.filter((consent) => consent.athlete_id !== athleteId));
      const cached = readCached<{ athletes: Athlete[]; consents: Consent[] }>(guardianId, "family");
      if (cached) writeCached(guardianId, "family", { athletes: cached.athletes.filter((athlete) => athlete.id !== athleteId), consents: cached.consents.filter((consent) => consent.athlete_id !== athleteId) });
      for (const scope of ["training_sessions", "skill_tests"]) {
        const records = readCached<{ athlete_id: string }[]>(guardianId, scope);
        if (Array.isArray(records)) writeCached(guardianId, scope, records.filter((record) => record.athlete_id !== athleteId));
      }
      await reload();
    },
    [guardianId, reload],
  );

  return { athletes, consents, loading, error, reload, create, createSelf, update, revoke, authorize, remove, hasCache: Boolean(cached) };
}
