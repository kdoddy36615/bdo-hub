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

-- Grant full CRUD to roles (middleware protects routes, anon key protects API)
grant select, insert, update, delete on public.mentor_answers to authenticated;
grant select, insert, update, delete on public.mentor_answers to anon;

create policy "Anyone can read mentor answers" on public.mentor_answers
  for select using (true);

create policy "Anyone can insert mentor answers" on public.mentor_answers
  for insert with check (true);

create policy "Anyone can update mentor answers" on public.mentor_answers
  for update using (true) with check (true);

create policy "Anyone can delete mentor answers" on public.mentor_answers
  for delete using (true);
