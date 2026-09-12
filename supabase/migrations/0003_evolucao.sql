-- Baseline by Arvoredo — evolução: meta semanal por atleta e testes de habilidade a cada 4 semanas.

-- Meta de treinos por semana, definida pelo responsável.
alter table public.athletes
  add column if not exists weekly_goal smallint not null default 3 check (weekly_goal between 1 and 7);

-- Uma bateria de testes por data. results guarda { id_do_teste: valor } só dos testes feitos.
create table if not exists public.skill_tests (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references auth.users(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  tested_on date not null,
  results jsonb not null default '{}'::jsonb check (jsonb_typeof(results) = 'object'),
  created_at timestamptz not null default now()
);
create index if not exists skill_tests_athlete_idx on public.skill_tests (athlete_id, tested_on desc);
create index if not exists skill_tests_guardian_idx on public.skill_tests (guardian_id);

alter table public.skill_tests enable row level security;
revoke all on table public.skill_tests from anon, authenticated;
grant select, insert, delete on table public.skill_tests to authenticated;

drop policy if exists "skill_tests_select_own" on public.skill_tests;
create policy "skill_tests_select_own" on public.skill_tests for select to authenticated
  using ((select auth.uid()) = guardian_id);

drop policy if exists "skill_tests_insert_own" on public.skill_tests;
create policy "skill_tests_insert_own" on public.skill_tests for insert to authenticated
  with check (
    (select auth.uid()) = guardian_id
    and exists (select 1 from public.athletes a where a.id = athlete_id and a.guardian_id = (select auth.uid()))
  );

drop policy if exists "skill_tests_delete_own" on public.skill_tests;
create policy "skill_tests_delete_own" on public.skill_tests for delete to authenticated
  using ((select auth.uid()) = guardian_id);
