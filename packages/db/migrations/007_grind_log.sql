create table public.grind_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  spot_name text not null,
  duration_minutes integer not null,
  silver_earned bigint not null default 0,
  trash_loot integer not null default 0,
  special_drops text default '',
  notes text default '',
  grind_date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.grind_sessions enable row level security;
create policy "Users manage own sessions" on public.grind_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index idx_grind_sessions_user on public.grind_sessions(user_id);
create index idx_grind_sessions_date on public.grind_sessions(grind_date);
