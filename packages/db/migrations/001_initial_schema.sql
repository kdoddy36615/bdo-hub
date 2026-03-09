-- BDO Command Center - Initial Schema
-- Run against Supabase SQL Editor or via supabase db push

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null default '',
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Users manage own profile" on public.profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- CHARACTERS
-- ============================================================
create table public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  class_name text not null,
  level integer not null default 1,
  ap integer default 0,
  aap integer default 0,
  dp integer default 0,
  gear_score integer generated always as (ap + aap + dp) stored,
  is_main boolean not null default false,
  notes text,
  last_played timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.characters enable row level security;
create policy "Users manage own characters" on public.characters
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index idx_characters_user on public.characters(user_id);

-- ============================================================
-- CHARACTER TAGS
-- ============================================================
create table public.character_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  main_character_id uuid not null references public.characters(id) on delete cascade,
  tagged_character_id uuid not null references public.characters(id) on delete cascade,
  gear_copied text,
  marni_fuel_used integer default 0,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.character_tags enable row level security;
create policy "Users manage own tags" on public.character_tags
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index idx_character_tags_user on public.character_tags(user_id);

-- ============================================================
-- PROGRESSION ITEMS
-- ============================================================
create table public.progression_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null check (category in ('combat','lifeskill','journal','gear','quest','other')),
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed','skipped')),
  priority text not null default 'medium' check (priority in ('critical','high','medium','low')),
  difficulty_est text check (difficulty_est in ('easy','medium','hard','extreme')),
  notes text,
  refs text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.progression_items enable row level security;
create policy "Users manage own progression" on public.progression_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index idx_progression_user on public.progression_items(user_id, status);

-- ============================================================
-- ACTIVITIES (Time-Gated Tracker)
-- ============================================================
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null check (category in ('daily','weekly','event','other')),
  reset_type text not null check (reset_type in ('daily','weekly','biweekly','monthly','custom')),
  reset_day integer,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.activities enable row level security;
create policy "Users manage own activities" on public.activities
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index idx_activities_user on public.activities(user_id, is_active);

-- ============================================================
-- ACTIVITY COMPLETIONS
-- ============================================================
create table public.activity_completions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  reset_period text not null,
  notes text,
  unique (activity_id, reset_period)
);

alter table public.activity_completions enable row level security;
create policy "Users manage own completions" on public.activity_completions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index idx_activity_completions_period on public.activity_completions(activity_id, reset_period);

-- ============================================================
-- BOSSES (Reference Data)
-- ============================================================
create table public.bosses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  priority text not null default 'medium' check (priority in ('high','medium','low')),
  spawn_type text not null check (spawn_type in ('field','world','special')),
  spawn_schedule jsonb default '[]'::jsonb,
  location text,
  notable_drops text[] default '{}',
  notes text
);

alter table public.bosses enable row level security;
create policy "Authenticated read bosses" on public.bosses
  for select using (auth.uid() is not null);

-- ============================================================
-- BOSS ALTS
-- ============================================================
create table public.boss_alts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  boss_id uuid not null references public.bosses(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  notes text,
  last_used timestamptz,
  created_at timestamptz not null default now()
);

alter table public.boss_alts enable row level security;
create policy "Users manage own boss alts" on public.boss_alts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- BOSS HISTORY
-- ============================================================
create table public.boss_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  boss_id uuid not null references public.bosses(id) on delete cascade,
  date timestamptz not null default now(),
  attended boolean not null default true,
  fragments_obtained integer default 0,
  drops text,
  notes text
);

alter table public.boss_history enable row level security;
create policy "Users manage own boss history" on public.boss_history
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index idx_boss_history_user on public.boss_history(user_id, date desc);

-- ============================================================
-- PLAYBOOKS
-- ============================================================
create table public.playbooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text check (category in ('grinding','boss','lifeskill','enhancing','fishing','weekly','other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.playbooks enable row level security;
create policy "Users manage own playbooks" on public.playbooks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index idx_playbooks_user on public.playbooks(user_id);

-- ============================================================
-- PLAYBOOK STEPS
-- ============================================================
create table public.playbook_steps (
  id uuid primary key default gen_random_uuid(),
  playbook_id uuid not null references public.playbooks(id) on delete cascade,
  step_number integer not null,
  title text not null,
  content text,
  is_optional boolean not null default false,
  unique (playbook_id, step_number)
);

alter table public.playbook_steps enable row level security;
create policy "Users manage own playbook steps" on public.playbook_steps
  for all using (
    exists (
      select 1 from public.playbooks p
      where p.id = playbook_steps.playbook_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.playbooks p
      where p.id = playbook_steps.playbook_id and p.user_id = auth.uid()
    )
  );
create index idx_playbook_steps on public.playbook_steps(playbook_id, step_number);

-- ============================================================
-- RESOURCES
-- ============================================================
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  url text,
  resource_type text check (resource_type in ('guide','tool','video','wiki','discord','other')),
  author text,
  date_verified timestamptz,
  notes text,
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

alter table public.resources enable row level security;
create policy "Users manage own resources" on public.resources
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index idx_resources_user on public.resources(user_id);

-- ============================================================
-- MENTOR QUESTIONS & ANSWERS
-- ============================================================
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_text text not null,
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

alter table public.questions enable row level security;
create policy "Users manage own questions" on public.questions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index idx_questions_user on public.questions(user_id);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  answer_text text not null,
  source_url text,
  source_type text check (source_type in ('mentor','guide','wiki','personal','other')),
  confidence text check (confidence in ('low','medium','high','verified')),
  verified_date timestamptz,
  created_at timestamptz not null default now()
);

alter table public.answers enable row level security;
create policy "Users manage own answers" on public.answers
  for all using (
    exists (
      select 1 from public.questions q
      where q.id = answers.question_id and q.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.questions q
      where q.id = answers.question_id and q.user_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE TABS
-- ============================================================
create table public.storage_tabs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tab_number integer not null check (tab_number between 1 and 20),
  label text not null,
  description text,
  color text,
  unique (user_id, tab_number)
);

alter table public.storage_tabs enable row level security;
create policy "Users manage own storage" on public.storage_tabs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index idx_storage_tabs_user on public.storage_tabs(user_id);

-- ============================================================
-- GATHERING ITEMS (Reference Data)
-- ============================================================
create table public.gathering_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  use_description text,
  why_it_matters text,
  is_gathering_exclusive boolean not null default true,
  market_availability text
);

alter table public.gathering_items enable row level security;
create policy "Authenticated read gathering" on public.gathering_items
  for select using (auth.uid() is not null);

-- ============================================================
-- USER SETTINGS
-- ============================================================
create table public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  daily_reset_time time not null default '19:00',
  weekly_reset_day integer not null default 3,
  timezone text not null default 'America/New_York',
  notification_enabled boolean not null default false,
  theme text not null default 'dark',
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;
create policy "Users manage own settings" on public.user_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.characters
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.progression_items
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.playbooks
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.user_settings
  for each row execute function public.update_updated_at();
