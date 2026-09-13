-- Baseline by Arvoredo — adultos: o dono da conta (18+) pode ter o próprio perfil de treino,
-- além dos perfis de crianças e adolescentes que cadastrar.

-- Adultos podem ter nascido antes de 2000.
alter table public.athletes drop constraint if exists athletes_birth_year_check;
alter table public.athletes add constraint athletes_birth_year_check check (birth_year between 1900 and 2100);

-- is_self: perfil do próprio dono da conta. No máximo um por conta; o tipo não muda depois de criado.
alter table public.athletes add column if not exists is_self boolean not null default false;
create unique index if not exists athletes_one_self_per_account on public.athletes (guardian_id) where is_self;

-- Faixa de idade por tipo de perfil, no cadastro e na correção (substitui a versão da 0004, que só olhava a correção).
create or replace function public.athletes_check_age()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_age int := extract(year from now())::int - new.birth_year;
begin
  if tg_op = 'UPDATE' and new.is_self is distinct from old.is_self then
    raise exception 'tipo de perfil nao pode ser alterado';
  end if;
  if tg_op = 'INSERT' or new.birth_year is distinct from old.birth_year then
    if new.is_self and (v_age < 18 or v_age > 110) then
      raise exception 'perfil proprio exige 18 anos ou mais';
    end if;
    if not new.is_self and (v_age < 6 or v_age > 17) then
      raise exception 'idade fora da faixa de 6 a 17 anos';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists athletes_check_age on public.athletes;
create trigger athletes_check_age before insert or update on public.athletes
  for each row execute function public.athletes_check_age();

-- Perfil próprio + consentimento do titular na mesma transação. O registro fica em consents como qualquer
-- aceite; em perfil próprio, guardian_declaration é a declaração do próprio adulto. Assim treinos e testes
-- continuam exigindo aceite ativo para todos os perfis (policies da 0004), inclusive o do adulto.
create or replace function public.create_self_profile_with_consent(
  p_nickname text,
  p_birth_year smallint,
  p_level text,
  p_position text,
  p_document_version text
)
returns public.athletes
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_athlete public.athletes;
begin
  if (select auth.uid()) is null then
    raise exception 'nao autenticado';
  end if;

  insert into public.athletes (guardian_id, nickname, birth_year, level, position, is_self)
  values ((select auth.uid()), btrim(p_nickname), p_birth_year, coalesce(p_level, 'iniciante'), p_position, true)
  returning * into v_athlete;

  insert into public.consents (guardian_id, athlete_id, document_version, guardian_declaration)
  values ((select auth.uid()), v_athlete.id, p_document_version, true);

  return v_athlete;
end;
$$;
revoke execute on function public.create_self_profile_with_consent(text, smallint, text, text, text) from public, anon;
grant execute on function public.create_self_profile_with_consent(text, smallint, text, text, text) to authenticated;
