-- Baseline by Arvoredo — privacidade: renovar autorização, revogação definitiva,
-- bloqueio de perfis sem autorização e correção de perfil dentro da faixa de idade.

-- Um termo pode ser aceito de novo depois de revogado: a unicidade vale só para autorizações ativas.
alter table public.consents drop constraint if exists consents_athlete_id_document_version_key;
create unique index if not exists consents_one_active_per_version
  on public.consents (athlete_id, document_version) where revoked_at is null;

-- Revogação é definitiva: autorizar de novo cria outro registro e o histórico fica preservado.
create or replace function public.consents_keep_revocation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at then
    raise exception 'autorizacao revogada nao pode ser reativada';
  end if;
  return new;
end;
$$;

drop trigger if exists consents_keep_revocation on public.consents;
create trigger consents_keep_revocation before update on public.consents
  for each row execute function public.consents_keep_revocation();

-- Correção do ano de nascimento continua limitada à faixa de 6 a 17 anos.
create or replace function public.athletes_check_age()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_age int := extract(year from now())::int - new.birth_year;
begin
  if new.birth_year is distinct from old.birth_year and (v_age < 6 or v_age > 17) then
    raise exception 'idade fora da faixa de 6 a 17 anos';
  end if;
  return new;
end;
$$;

drop trigger if exists athletes_check_age on public.athletes;
create trigger athletes_check_age before update on public.athletes
  for each row execute function public.athletes_check_age();

-- Treinos e testes novos só para atleta da própria família com autorização ativa.
-- Colunas qualificadas pelo nome da tabela: dentro do subselect, athlete_id sozinho seria o de consents.
drop policy if exists "training_sessions_insert_own" on public.training_sessions;
create policy "training_sessions_insert_own" on public.training_sessions for insert to authenticated
  with check (
    (select auth.uid()) = guardian_id
    and exists (select 1 from public.athletes a where a.id = training_sessions.athlete_id and a.guardian_id = (select auth.uid()))
    and exists (select 1 from public.consents c where c.athlete_id = training_sessions.athlete_id and c.revoked_at is null)
  );

drop policy if exists "skill_tests_insert_own" on public.skill_tests;
create policy "skill_tests_insert_own" on public.skill_tests for insert to authenticated
  with check (
    (select auth.uid()) = guardian_id
    and exists (select 1 from public.athletes a where a.id = skill_tests.athlete_id and a.guardian_id = (select auth.uid()))
    and exists (select 1 from public.consents c where c.athlete_id = skill_tests.athlete_id and c.revoked_at is null)
  );
