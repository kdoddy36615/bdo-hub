-- Run after the legacy migrations, in the same transaction on a fresh project.
-- Existing ownerless gear/answers remain preserved but inaccessible to API users.
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

alter table public.mentor_answers add column user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table public.gear_slots add column user_id uuid default auth.uid() references auth.users(id) on delete cascade;
alter table public.gear_slots drop constraint gear_slots_slot_key_key;
alter table public.gear_slots add constraint gear_slots_owner_slot_key unique (user_id, slot_key);

drop policy "Anyone can read mentor answers" on public.mentor_answers;
drop policy "Anyone can insert mentor answers" on public.mentor_answers;
drop policy "Anyone can update mentor answers" on public.mentor_answers;
drop policy "Anyone can delete mentor answers" on public.mentor_answers;
drop policy "Anyone can manage gear slots" on public.gear_slots;
create policy "Users manage own mentor answers" on public.mentor_answers for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users manage own gear" on public.gear_slots for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create index idx_mentor_answers_user on public.mentor_answers(user_id);
create index idx_gear_slots_user on public.gear_slots(user_id);

-- The browser deliberately omits owner IDs: derive them from the verified JWT.
do $$
declare t text;
begin
  foreach t in array array['profiles','characters','character_tags','progression_items','activities',
    'activity_completions','boss_alts','boss_history','playbooks','resources','questions',
    'storage_tabs','user_settings','daily_tasks','daily_completions','grind_sessions']
  loop
    execute format('alter table public.%I alter column user_id set default auth.uid()', t);
  end loop;
  foreach t in array array['profiles','characters','character_tags','progression_items','activities',
    'activity_completions','boss_alts','boss_history','playbooks','playbook_steps','resources','questions',
    'answers','storage_tabs','user_settings','daily_tasks','daily_completions','grind_sessions','mentor_answers','gear_slots']
  loop
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;
revoke all on public.bosses, public.gathering_items from anon;
grant select on public.bosses, public.gathering_items to authenticated;

-- Do not let an owned row refer to another visitor's parent records.
create policy "Owned activity parent" on public.activity_completions as restrictive for all to authenticated
  using (true) with check (exists(select 1 from public.activities a where a.id = activity_id and a.user_id = (select auth.uid())));
create policy "Owned task parent" on public.daily_completions as restrictive for all to authenticated
  using (true) with check (exists(select 1 from public.daily_tasks t where t.id = task_id and t.user_id = (select auth.uid())));
create policy "Owned tagged characters" on public.character_tags as restrictive for all to authenticated
  using (true) with check (
    exists(select 1 from public.characters c where c.id = main_character_id and c.user_id = (select auth.uid())) and
    exists(select 1 from public.characters c where c.id = tagged_character_id and c.user_id = (select auth.uid())));
create policy "Owned boss character" on public.boss_alts as restrictive for all to authenticated
  using (true) with check (exists(select 1 from public.characters c where c.id = character_id and c.user_id = (select auth.uid())));

-- Composite FK enforces reply ownership without recursively querying its RLS policy.
alter table public.mentor_answers add constraint mentor_answers_id_owner unique(id, user_id);
alter table public.mentor_answers add constraint mentor_reply_owner
  foreign key(parent_answer_id, user_id) references public.mentor_answers(id, user_id) on delete cascade;

drop trigger on_auth_user_created on auth.users;
drop function public.handle_new_user();
create function app_private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(user_id, display_name)
    values(new.id, case when new.is_anonymous then 'Demo visitor' else coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), '') end);
  insert into public.user_settings(user_id) values(new.id);
  if new.is_anonymous then
    insert into public.characters(user_id,name,class_name,level,ap,aap,dp,is_main,notes)
      values(new.id,'Demo Maegu','Maegu',61,250,252,310,true,'Illustrative sample character. Edit or replace it.');
    insert into public.progression_items(user_id,title,category,status,priority,sort_order) values
      (new.id,'Choose a main character','other','completed','high',0),
      (new.id,'Plan the next gear upgrade','gear','in_progress','high',1),
      (new.id,'Practice a grinding rotation','combat','not_started','medium',2);
    insert into public.activities(user_id,name,category,reset_type,description,sort_order) values
      (new.id,'Review daily goals','daily','daily','Sample activity; customize for your routine.',0),
      (new.id,'Plan a weekly boss run','weekly','weekly','Sample activity; verify current game schedules.',1);
    insert into public.gear_slots(user_id,slot_key,item_name,enhancement,ap,notes)
      values(new.id,'mainhand','Sample main weapon','PEN',100,'Illustrative demo gear.');
  end if;
  return new;
end;
$$;
revoke all on function app_private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function app_private.handle_new_user();
alter function public.update_updated_at() set search_path = '';
revoke all on function public.update_updated_at() from public, anon, authenticated;
