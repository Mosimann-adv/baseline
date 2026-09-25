-- Baseline by Arvoredo — endurece a confirmação do responsável (página pública #/confirmar-responsavel).
-- Rodar DEPOIS da 0006. O código passa a vencer em 15 minutos, errar 5 vezes bloqueia até vir um código
-- novo, e a conferência ignora códigos vencidos. Tabela ganha índice por e-mail do responsável.

-- A tabela só não existirá aqui se a 0006 ainda não tiver sido aplicada; nesse caso o dono roda a 0006 primeiro.
create table if not exists public.parent_confirmations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  parent_email text not null check (parent_email ~* '^[^@]+@[^@]+\.[^@]+$'),
  code_hash text not null,
  code_plain text,
  confirmed_at timestamptz,
  expires_at timestamptz,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.parent_confirmations add column if not exists expires_at timestamptz;
alter table public.parent_confirmations add column if not exists attempts int not null default 0;

-- Códigos antigos (pré-0007) já nasceram vencidos: ninguém consegue usá-los, o app pede um novo sozinho.
update public.parent_confirmations set expires_at = created_at + interval '15 minutes' where expires_at is null;

create index if not exists parent_confirmations_parent_email_idx on public.parent_confirmations (parent_email);

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
    'code', case
      when v_row.confirmed_at is null
        and v_row.expires_at is not null
        and v_row.expires_at > now()
      then v_row.code_plain
      else null
    end
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

  insert into public.parent_confirmations (user_id, parent_email, code_hash, code_plain, confirmed_at, expires_at, attempts)
  values (v_uid, v_email, v_hash, v_code, null, now() + interval '15 minutes', 0)
  on conflict (user_id) do update
    set parent_email = excluded.parent_email,
        code_hash = excluded.code_hash,
        code_plain = excluded.code_plain,
        confirmed_at = parent_confirmations.confirmed_at,
        expires_at = excluded.expires_at,
        attempts = 0
    where parent_confirmations.confirmed_at is null;

  return public.parent_confirmation_status();
end;
$$;
revoke execute on function public.register_parent_email(text, text) from public, anon;
grant execute on function public.register_parent_email(text, text) to authenticated;

-- Página pública: o responsável confirma sem login. Código de 6 dígitos, 15 minutos de validade,
-- 5 erros bloqueiam até o adolescente pedir um código novo (que zera o contador).
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

  if exists (
    select 1 from public.parent_confirmations
    where parent_email = v_email and confirmed_at is null and attempts >= 5
  ) then
    raise exception 'codigo bloqueado apos muitas tentativas';
  end if;

  -- Todos os códigos pendentes desse e-mail venceram: a mensagem certa é "peça outro", não "errou".
  if exists (
    select 1 from public.parent_confirmations
    where parent_email = v_email and confirmed_at is null
  )
  and not exists (
    select 1 from public.parent_confirmations
    where parent_email = v_email and confirmed_at is null and expires_at > now()
  ) then
    raise exception 'codigo expirado';
  end if;

  -- Irmãos podem usar o mesmo e-mail do responsável: cada conta tem o seu código.
  for v_row in
    select * from public.parent_confirmations
    where parent_email = v_email
      and confirmed_at is null
      and expires_at > now()
    order by created_at desc
  loop
    v_hash := encode(extensions.digest((v_code || ':' || v_row.user_id::text)::bytea, 'sha256'), 'hex');
    if v_hash = v_row.code_hash then
      update public.parent_confirmations
        set confirmed_at = now(), code_plain = null
        where user_id = v_row.user_id;
      return true;
    end if;
  end loop;

  update public.parent_confirmations
    set attempts = attempts + 1
    where parent_email = v_email and confirmed_at is null;
  return false;
end;
$$;
revoke execute on function public.confirm_parent_code(text, text) from public;
grant execute on function public.confirm_parent_code(text, text) to anon, authenticated;

select 'baseline: 0007 aplicada' as resultado;
