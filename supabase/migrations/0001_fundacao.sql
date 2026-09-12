-- Baseline by Arvoredo — fundação: perfis de atleta, autorizações e exclusão de conta.
-- O usuário autenticado (auth.users) é sempre o responsável. Atletas não têm login.

create extension if not exists pgcrypto;

-- ---------- Perfis de atleta (coleta mínima: apelido e ano de nascimento) ----------
create table if not exists public.athletes (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null check (char_length(btrim(nickname)) between 1 and 24),
  birth_year smallint not null check (birth_year between 2000 and 2100),
  level text not null default 'iniciante' check (level in ('iniciante','intermediario','avancado')),
  position text check (position in ('armador','ala','pivo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists athletes_guardian_idx on public.athletes (guardian_id);

-- ---------- Autorização do responsável, por atleta e por versão do termo (LGPD art. 14) ----------
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references auth.users(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  document_version text not null,
  guardian_declaration boolean not null check (guardian_declaration),
  accepted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (athlete_id, document_version)
);
create index if not exists consents_guardian_idx on public.consents (guardian_id);

-- ---------- Acesso: cada responsável só enxerga a própria família ----------
alter table public.athletes enable row level security;
alter table public.consents enable row level security;
revoke all on table public.athletes, public.consents from anon, authenticated;
grant select, insert, update, delete on table public.athletes to authenticated;
grant select, insert on table public.consents to authenticated;
-- Autorização aceita não é editável; só pode ser revogada.
grant update (revoked_at) on table public.consents to authenticated;

drop policy if exists "athletes_own" on public.athletes;
create policy "athletes_own" on public.athletes for all to authenticated
  using ((select auth.uid()) = guardian_id)
  with check ((select auth.uid()) = guardian_id);

drop policy if exists "consents_select_own" on public.consents;
create policy "consents_select_own" on public.consents for select to authenticated
  using ((select auth.uid()) = guardian_id);

drop policy if exists "consents_insert_own" on public.consents;
create policy "consents_insert_own" on public.consents for insert to authenticated
  with check (
    (select auth.uid()) = guardian_id
    and exists (select 1 from public.athletes a where a.id = athlete_id and a.guardian_id = (select auth.uid()))
  );

drop policy if exists "consents_revoke_own" on public.consents;
create policy "consents_revoke_own" on public.consents for update to authenticated
  using ((select auth.uid()) = guardian_id)
  with check ((select auth.uid()) = guardian_id);

-- ---------- Cadastro do atleta junto com a autorização, numa única transação ----------
create or replace function public.create_athlete_with_consent(
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
  v_age int := extract(year from now())::int - p_birth_year;
  v_athlete public.athletes;
begin
  if (select auth.uid()) is null then
    raise exception 'nao autenticado';
  end if;
  if v_age < 6 or v_age > 17 then
    raise exception 'idade fora da faixa de 6 a 17 anos';
  end if;

  insert into public.athletes (guardian_id, nickname, birth_year, level, position)
  values ((select auth.uid()), btrim(p_nickname), p_birth_year, coalesce(p_level, 'iniciante'), p_position)
  returning * into v_athlete;

  insert into public.consents (guardian_id, athlete_id, document_version, guardian_declaration)
  values ((select auth.uid()), v_athlete.id, p_document_version, true);

  return v_athlete;
end;
$$;
revoke execute on function public.create_athlete_with_consent(text, smallint, text, text, text) from public, anon;
grant execute on function public.create_athlete_with_consent(text, smallint, text, text, text) to authenticated;

-- ---------- Exclusão da conta pelo próprio responsável (exigência do Google Play) ----------
-- security definer: só o dono do banco pode apagar de auth.users; a função apaga apenas o usuário da sessão.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'nao autenticado';
  end if;
  delete from auth.users where id = (select auth.uid());
end;
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------- updated_at ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists athletes_set_updated_at on public.athletes;
create trigger athletes_set_updated_at before update on public.athletes
  for each row execute function public.set_updated_at();
