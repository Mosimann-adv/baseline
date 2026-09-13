-- Baseline by Arvoredo — conta própria a partir de 16 anos, com e-mail do responsável confirmando.
-- Perfil próprio (is_self) passa a aceitar 16–17. Menores de 16 continuam só como perfil criado pelo responsável.

create extension if not exists pgcrypto with schema extensions;

-- Idade do perfil próprio: 16 a 110. Menor cadastrado pelo responsável: 6 a 17.
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
    if new.is_self and (v_age < 16 or v_age > 110) then
      raise exception 'perfil proprio exige 16 anos ou mais';
    end if;
    if not new.is_self and (v_age < 6 or v_age > 17) then
      raise exception 'idade fora da faixa de 6 a 17 anos';
    end if;
  end if;
  return new;
end;
$$;

create table if not exists public.parent_confirmations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  parent_email text not null check (parent_email ~* '^[^@]+@[^@]+\.[^@]+$'),
  code_hash text not null,
  code_plain text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.parent_confirmations enable row level security;
revoke all on table public.parent_confirmations from anon, authenticated;
grant select, insert, update on table public.parent_confirmations to authenticated;

drop policy if exists "parent_confirmations_select_own" on public.parent_confirmations;
create policy "parent_confirmations_select_own" on public.parent_confirmations for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "parent_confirmations_insert_own" on public.parent_confirmations;
create policy "parent_confirmations_insert_own" on public.parent_confirmations for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "parent_confirmations_update_own" on public.parent_confirmations;
create policy "parent_confirmations_update_own" on public.parent_confirmations for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.parent_confirmation_status()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row public.parent_confirmations;
begin
  if (select auth.uid()) is null then
    raise exception 'nao autenticado';
  end if;
  select * into v_row from public.parent_confirmations where user_id = (select auth.uid());
  if not found then
    -- Sem registro = adolescente ainda não pediu confirmação. Adultos não usam esta função.
    return jsonb_build_object('parent_email', null, 'confirmed', false, 'code', null);
  end if;
  return jsonb_build_object(
    'parent_email', v_row.parent_email,
    'confirmed', v_row.confirmed_at is not null,
    'code', case when v_row.confirmed_at is null then v_row.code_plain else null end
  );
end;
$$;
revoke execute on function public.parent_confirmation_status() from public, anon;
grant execute on function public.parent_confirmation_status() to authenticated;

create or replace function public.register_parent_email(p_parent_email text, p_code text)
returns jsonb
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_email text := lower(btrim(p_parent_email));
  v_code text := btrim(p_code);
  v_uid uuid := (select auth.uid());
  v_hash text;
begin
  if v_uid is null then
    raise exception 'nao autenticado';
  end if;
  if v_email !~ '^[^@]+@[^@]+\.[^@]+$' then
    raise exception 'e-mail do responsavel invalido';
  end if;
  if v_code !~ '^[0-9]{6}$' then
    raise exception 'codigo invalido';
  end if;
  v_hash := encode(extensions.digest((v_code || ':' || v_uid::text)::bytea, 'sha256'), 'hex');

  insert into public.parent_confirmations (user_id, parent_email, code_hash, code_plain, confirmed_at)
  values (v_uid, v_email, v_hash, v_code, null)
  on conflict (user_id) do update
    set parent_email = excluded.parent_email,
        code_hash = excluded.code_hash,
        code_plain = excluded.code_plain,
        confirmed_at = parent_confirmations.confirmed_at
    where parent_confirmations.confirmed_at is null;

  return public.parent_confirmation_status();
end;
$$;
revoke execute on function public.register_parent_email(text, text) from public, anon;
grant execute on function public.register_parent_email(text, text) to authenticated;

-- Página pública: o responsável confirma sem login.
create or replace function public.confirm_parent_code(p_parent_email text, p_code text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_email text := lower(btrim(p_parent_email));
  v_code text := btrim(p_code);
  v_row public.parent_confirmations;
  v_hash text;
begin
  if v_email !~ '^[^@]+@[^@]+\.[^@]+$' or v_code !~ '^[0-9]{6}$' then
    return false;
  end if;

  for v_row in
    select * from public.parent_confirmations
    where parent_email = v_email and confirmed_at is null
  loop
    v_hash := encode(extensions.digest((v_code || ':' || v_row.user_id::text)::bytea, 'sha256'), 'hex');
    if v_hash = v_row.code_hash then
      update public.parent_confirmations
        set confirmed_at = now(), code_plain = null
        where user_id = v_row.user_id;
      return true;
    end if;
  end loop;
  return false;
end;
$$;
revoke execute on function public.confirm_parent_code(text, text) from public;
grant execute on function public.confirm_parent_code(text, text) to anon, authenticated;

select 'baseline: 0006 aplicada' as resultado;
