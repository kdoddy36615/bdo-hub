create table public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  category text not null default 'daily',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.daily_tasks enable row level security;
create policy "Users manage own tasks" on public.daily_tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.daily_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.daily_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique(task_id, completed_date)
);

alter table public.daily_completions enable row level security;
create policy "Users manage own completions" on public.daily_completions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
