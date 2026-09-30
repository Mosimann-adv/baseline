-- Baseline — sessões compostas, trilhas e metas históricas. Idempotente.
-- Aplicar depois de 0006. Não muda RLS, aceites ou a coleta mínima de dor (sim/não).
begin;

alter table public.training_sessions add column if not exists execution jsonb;
alter table public.athletes add column if not exists goal_history jsonb not null default '{}'::jsonb;
alter table public.athletes add column if not exists earned_badges text[] not null default '{}';
alter table public.athletes drop constraint if exists athletes_earned_badges_check;
alter table public.athletes add constraint athletes_earned_badges_check check (
  earned_badges <@ array['primeiro-treino','ate-o-fim','5-treinos','20-treinos','semana-cheia','3-semanas','60-minutos','primeiro-teste','evoluiu']::text[]
);

create or replace function public.baseline_execution_valid(e jsonb)
returns boolean language plpgsql immutable set search_path = public as $$
declare b jsonb; d jsonb;
begin
  if e is null then return true; end if;
  if jsonb_typeof(e) <> 'object' then return false; end if;
  if (e - array['version','contentVersion','kind','mode','seconds','completed','blocks','trailId','trailStepId']) <> '{}'::jsonb then return false; end if;
  if coalesce(e->>'version','') <> '1' or coalesce(e->>'kind','') not in ('block','session') or coalesce(e->>'mode','') not in ('learn','train') then return false; end if;
  if coalesce(e->>'contentVersion','') !~ '^[a-zA-Z0-9._:-]{1,64}$' then return false; end if;
  if coalesce(e->>'seconds','') !~ '^[0-9]{1,5}$' then return false; end if;
  if (e->>'seconds')::integer > 18000 then return false; end if;
  if jsonb_typeof(e->'completed') is distinct from 'array' or jsonb_typeof(e->'blocks') is distinct from 'array' then return false; end if;
  if jsonb_array_length(e->'completed') > 128 or jsonb_array_length(e->'blocks') > 32 then return false; end if;
  for d in select value from jsonb_array_elements(e->'completed') loop
    if jsonb_typeof(d) <> 'string' or (d #>> '{}') !~ '^[a-zA-Z0-9._:-]{1,128}$' then return false; end if;
  end loop;
  for b in select value from jsonb_array_elements(e->'blocks') loop
    if jsonb_typeof(b) <> 'object' then return false; end if;
    if (b - array['id','category','done','total','seconds']) <> '{}'::jsonb then return false; end if;
    if coalesce(b->>'id','') !~ '^[a-zA-Z0-9._:-]{1,64}$' or coalesce(b->>'category','') not in ('drible','arremesso','passe','defesa','fisico') then return false; end if;
    if coalesce(b->>'done','') !~ '^[0-9]{1,3}$' or coalesce(b->>'total','') !~ '^[0-9]{1,3}$' or coalesce(b->>'seconds','') !~ '^[0-9]{1,5}$' then return false; end if;
    if (b->>'total')::integer < 1 or (b->>'done')::integer > (b->>'total')::integer or (b->>'seconds')::integer > 18000 then return false; end if;
  end loop;
  if e ? 'trailId' and coalesce(e->>'trailId','') !~ '^[a-zA-Z0-9._:-]{1,64}$' then return false; end if;
  if e ? 'trailStepId' and coalesce(e->>'trailStepId','') !~ '^[a-zA-Z0-9._:-]{1,64}$' then return false; end if;
  return true;
end;
$$;

alter table public.training_sessions drop constraint if exists training_sessions_execution_check;
alter table public.training_sessions add constraint training_sessions_execution_check
  check (public.baseline_execution_valid(execution) and (execution is null or jsonb_array_length(execution->'completed') = drills_done));
-- Um insert que omite a resposta não ganha automaticamente 'Não'. O app exige escolha explícita.
alter table public.training_sessions alter column discomfort drop default;

-- A meta disponível na migração é o ponto inicial; não inventamos metas antigas desconhecidas.
update public.athletes set goal_history = jsonb_build_object('0001-01-01', weekly_goal) where goal_history = '{}'::jsonb;

create or replace function public.baseline_keep_goal_history()
returns trigger language plpgsql set search_path = public as $$
declare week_key text := to_char(date_trunc('week', timezone('America/Sao_Paulo', now())), 'YYYY-MM-DD');
begin
  if tg_op = 'INSERT' then
    new.goal_history := jsonb_build_object('0001-01-01', new.weekly_goal);
  else
    new.goal_history := case when old.goal_history = '{}'::jsonb then jsonb_build_object('0001-01-01', old.weekly_goal) else old.goal_history end;
    new.earned_badges := array(select distinct id from unnest(old.earned_badges || new.earned_badges) as id order by id);
    if new.weekly_goal is distinct from old.weekly_goal then
      new.goal_history := new.goal_history || jsonb_build_object(week_key, new.weekly_goal);
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists athletes_goal_history on public.athletes;
create trigger athletes_goal_history before insert or update on public.athletes
for each row execute function public.baseline_keep_goal_history();

commit;
select 'baseline: 0007 aplicada' as resultado;
