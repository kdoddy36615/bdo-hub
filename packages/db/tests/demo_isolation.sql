-- Runs entirely inside a rollback: no test accounts or records persist.
begin;
select set_config('bdo_test.a', gen_random_uuid()::text, true);
select set_config('bdo_test.b', gen_random_uuid()::text, true);
insert into auth.users(id,is_anonymous,raw_user_meta_data,aud,role) values
  (current_setting('bdo_test.a')::uuid,true,'{}','authenticated','authenticated'),
  (current_setting('bdo_test.b')::uuid,true,'{}','authenticated','authenticated');
select set_config('bdo_test.foreign_character',id::text,true) from public.characters where user_id=current_setting('bdo_test.b')::uuid;
select set_config('request.jwt.claim.sub',current_setting('bdo_test.a'),true);
set local role authenticated;
do $$
declare affected integer;
begin
  if (select count(*) from public.characters) <> 1 then raise exception 'Character isolation failed'; end if;
  if (select count(*) from public.gear_slots) <> 1 then raise exception 'Gear isolation failed'; end if;
  if (select count(*) from public.profiles) <> 1 then raise exception 'Profile isolation failed'; end if;
  insert into public.characters(name,class_name) values('Isolation check','Maegu');
  if (select count(*) from public.characters) <> 2 then raise exception 'Default owner insert failed'; end if;
  update public.characters set name='Unauthorized' where id=current_setting('bdo_test.foreign_character')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-user update allowed'; end if;
  begin
    insert into public.characters(user_id,name,class_name) values(current_setting('bdo_test.b')::uuid,'Unauthorized','Maegu');
    raise exception 'Forged owner allowed';
  exception when insufficient_privilege then null;
  end;
  insert into public.mentor_answers(question_key,author,answer_text) values('sample','Demo','Private reply');
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('bdo_test.b'),true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.mentor_answers) <> 0 then raise exception 'Mentor answer isolation failed'; end if;
  if (select count(*) from public.characters) <> 1 then raise exception 'Second user isolation failed'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
  begin
    perform * from public.characters;
    raise exception 'Unauthenticated table access allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
select 'PASS: anonymous role denied; demo accounts isolated; owner defaults and private replies work' as verification;
rollback;
