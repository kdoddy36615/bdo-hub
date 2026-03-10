create table public.gear_slots (
  id uuid primary key default gen_random_uuid(),
  slot_key text not null unique,
  item_name text not null,
  enhancement text not null default '',
  ap integer default 0,
  aap integer default 0,
  dp integer default 0,
  accuracy integer default 0,
  evasion integer default 0,
  dr integer default 0,
  item_grade integer default 0,
  notes text default '',
  updated_at timestamptz not null default now()
);

alter table public.gear_slots enable row level security;
grant select, insert, update, delete on public.gear_slots to authenticated;
grant select, insert, update, delete on public.gear_slots to anon;
create policy "Anyone can manage gear slots" on public.gear_slots for all using (true) with check (true);
