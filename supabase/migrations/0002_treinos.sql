-- Baseline by Arvoredo — treinos registrados pelos atletas.
-- A biblioteca de treinos fica versionada no app (src/content); aqui só o que o atleta fez.

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references auth.users(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  program_id text not null check (char_length(program_id) between 1 and 64),
  performed_on date not null,
  minutes smallint not null check (minutes between 0 and 300),
  drills_done smallint not null check (drills_done >= 0),
  drills_total smallint not null check (drills_total > 0 and drills_done <= drills_total),
  feeling smallint check (feeling between 1 and 5),
  -- Dado de saúde mínimo: só sim/não. Nunca guardar local da dor, diagnóstico ou texto livre.
  discomfort boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists training_sessions_athlete_idx on public.training_sessions (athlete_id, performed_on desc);
create index if not exists training_sessions_guardian_idx on public.training_sessions (guardian_id);

alter table public.training_sessions enable row level security;
revoke all on table public.training_sessions from anon, authenticated;
-- Registro de treino não é editado: o responsável pode ver, criar e apagar.
grant select, insert, delete on table public.training_sessions to authenticated;

drop policy if exists "training_sessions_select_own" on public.training_sessions;
create policy "training_sessions_select_own" on public.training_sessions for select to authenticated
  using ((select auth.uid()) = guardian_id);

drop policy if exists "training_sessions_insert_own" on public.training_sessions;
create policy "training_sessions_insert_own" on public.training_sessions for insert to authenticated
  with check (
    (select auth.uid()) = guardian_id
    and exists (select 1 from public.athletes a where a.id = athlete_id and a.guardian_id = (select auth.uid()))
  );

drop policy if exists "training_sessions_delete_own" on public.training_sessions;
create policy "training_sessions_delete_own" on public.training_sessions for delete to authenticated
  using ((select auth.uid()) = guardian_id);
