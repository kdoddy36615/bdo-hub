-- Mentor answers table for shared Q&A (questions live in static JSON)
create table public.mentor_answers (
  id uuid primary key default gen_random_uuid(),
  question_key text not null,
  author text not null,
  answer_text text not null,
  source text default '',
  confidence text check (confidence in ('low','medium','high','verified')) default 'medium',
  created_at timestamptz not null default now()
);

alter table public.mentor_answers enable row level security;

-- Any authenticated user can read all mentor answers
create policy "Authenticated users can read mentor answers" on public.mentor_answers
  for select using (auth.uid() is not null);

-- Any authenticated user can insert mentor answers
create policy "Authenticated users can insert mentor answers" on public.mentor_answers
  for insert with check (auth.uid() is not null);
