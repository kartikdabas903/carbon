create table if not exists public.predictions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null,
  request jsonb not null default '{}'::jsonb,
  prediction jsonb not null default '{}'::jsonb,
  kind text not null default 'prediction' check (kind in ('prediction', 'calculation')),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create index if not exists predictions_user_created_idx
  on public.predictions (user_id, created_at desc);

create table if not exists public.recommendations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  prediction_id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  foreign key (prediction_id, user_id)
    references public.predictions (id, user_id) on delete cascade
);

create index if not exists recommendations_user_prediction_idx
  on public.recommendations (user_id, prediction_id);

create table if not exists public.chosen_actions (
  prediction_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  recommendation_id text,
  choice jsonb not null,
  created_at timestamptz not null default now(),
  foreign key (prediction_id, user_id)
    references public.predictions (id, user_id) on delete cascade
);

create index if not exists chosen_actions_user_created_idx
  on public.chosen_actions (user_id, created_at desc);

create table if not exists public.user_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reduction_pct integer not null check (reduction_pct between 10 and 100),
  target_year integer not null check (target_year between 2026 and 2050),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_budget_kg double precision not null check (monthly_budget_kg > 0),
  updated_at timestamptz not null default now()
);

alter table public.predictions enable row level security;
alter table public.recommendations enable row level security;
alter table public.chosen_actions enable row level security;
alter table public.user_goals enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists "Users manage their predictions" on public.predictions;
create policy "Users manage their predictions" on public.predictions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage their recommendations" on public.recommendations;
create policy "Users manage their recommendations" on public.recommendations
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage their chosen actions" on public.chosen_actions;
create policy "Users manage their chosen actions" on public.chosen_actions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage their goals" on public.user_goals;
create policy "Users manage their goals" on public.user_goals
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage their preferences" on public.user_preferences;
create policy "Users manage their preferences" on public.user_preferences
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.predictions to authenticated;
grant select, insert, update, delete on public.recommendations to authenticated;
grant select, insert, update, delete on public.chosen_actions to authenticated;
grant select, insert, update, delete on public.user_goals to authenticated;
grant select, insert, update, delete on public.user_preferences to authenticated;