-- Add parent_answer_id to support nested replies (Reddit-style threads)
alter table public.mentor_answers
  add column parent_answer_id uuid references public.mentor_answers(id) on delete cascade;

create index idx_mentor_answers_parent on public.mentor_answers(parent_answer_id);
