-- Access rules and business rules of the organizer.
-- Run with: npx supabase test db   (needs the local stack: npx supabase start)
-- Everything happens in one transaction that is rolled back at the end.

begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------
create schema tests;
grant usage on schema tests to anon, authenticated;

create function tests.id(n text) returns uuid language sql immutable as $$
  select ('a0000000-0000-0000-0000-00000000000' ||
    case n when 'ada' then '1' when 'bob' then '2' when 'cy' then '3'
           when 'dee' then '4' when 'eve' then '5' end)::uuid
$$;

create function tests.as_user(p_id uuid) returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id::text, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

create function tests.as_anon() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
end $$;

-- plain database access, no JWT (what migrations and the service role look like)
create function tests.as_db() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', true);
end $$;

create table tests.ctx (part_id uuid);
grant all on tests.ctx to authenticated;
grant execute on all functions in schema tests to anon, authenticated;

-- ---------------------------------------------------------------------------
-- fixtures: ada (admin, electrical), bob + dee (electrical), cy (mechanical),
-- eve (business). Created like the app does: auth user with admin metadata.
-- ---------------------------------------------------------------------------
insert into auth.users (id, aud, role, email, raw_app_meta_data) values
  (tests.id('ada'), 'authenticated', 'authenticated', 't_ada@krakens.invalid',
   '{"username":"t_ada","full_name":"Ada Admin","dept":"electrical","is_admin":true}'),
  (tests.id('bob'), 'authenticated', 'authenticated', 't_bob@krakens.invalid',
   '{"username":"t_bob","full_name":"Bob Builder","dept":"electrical"}'),
  (tests.id('cy'), 'authenticated', 'authenticated', 't_cy@krakens.invalid',
   '{"username":"t_cy","full_name":"Cy Mech","dept":"mechanical"}'),
  (tests.id('dee'), 'authenticated', 'authenticated', 't_dee@krakens.invalid',
   '{"username":"t_dee","full_name":"Dee Volt","dept":"electrical"}'),
  (tests.id('eve'), 'authenticated', 'authenticated', 't_eve@krakens.invalid',
   '{"username":"t_eve","full_name":"Eve Biz","dept":"business"}');

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------
-- The check is deferred to COMMIT, so force it inside a block that rolls back as a unit.
select throws_ok(
  $$ do $block$ begin
       insert into auth.users (id, aud, role, email)
       values (gen_random_uuid(), 'authenticated', 'authenticated', 'x@krakens.invalid');
       set constraints all immediate;
     end $block$ $$,
  '42501', 'Accounts are created by an admin only',
  'a self sign-up without admin metadata is rejected');

-- GoTrue's admin API inserts the user, then sets app_metadata in a second statement.
insert into auth.users (id, aud, role, email)
values ('a0000000-0000-0000-0000-0000000000f1', 'authenticated', 'authenticated', 't_gotrue@krakens.invalid');
update auth.users
set raw_app_meta_data = '{"username":"t_gotrue","full_name":"Two Step","dept":"business"}'
where id = 'a0000000-0000-0000-0000-0000000000f1';
set constraints all immediate;
select is((select username from public.profiles where id = 'a0000000-0000-0000-0000-0000000000f1'),
  't_gotrue', 'two-step creation (insert, then app_metadata) still produces the profile');
set constraints all deferred;

select throws_ok(
  $$ insert into auth.users (id, aud, role, email, raw_app_meta_data)
     values (gen_random_uuid(), 'authenticated', 'authenticated', 'bad@krakens.invalid',
             '{"username":"Bad Name","full_name":"X","dept":"business"}') $$,
  '23514', null, 'a malformed username is rejected');

select is((select username from public.profiles where id = tests.id('bob')), 't_bob',
  'the profile is built from the admin metadata');
select is((select must_change_password from public.profiles where id = tests.id('bob')), true,
  'new members must change their password');
select is((select count(*) from public.step_templates)::int, 12,
  'the 12 workflow steps ship with the schema');

-- ---------------------------------------------------------------------------
-- privileges: anonymous visitors get nothing
-- ---------------------------------------------------------------------------
select tests.as_anon();
select throws_ok($$ select count(*) from public.tasks $$, '42501', null, 'anon cannot read tasks');
select throws_ok($$ select count(*) from public.profiles $$, '42501', null, 'anon cannot read profiles');
select throws_ok($$ select public.create_part('x', 'electrical', tests.id('ada')) $$,
  '42501', null, 'anon cannot call create_part');

select tests.as_db();
select is_empty(
  $$ select p.oid::regprocedure
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('public', 'private')
       and has_function_privilege('anon', p.oid, 'execute') $$,
  'anon can execute no function in public or private (no PUBLIC EXECUTE leak)');
select is_empty(
  $$ select p.oid::regprocedure
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and has_function_privilege('authenticated', p.oid, 'execute')
       and p.oid <> 'public.create_part(text, public.dept, uuid, text, date, uuid[])'::regprocedure $$,
  'create_part is the only API function members can call');

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
select tests.as_user(tests.id('bob'));
select is((select count(*) from public.profiles where username like 't\_%')::int, 6, 'a member reads the whole directory');

with u as (update public.profiles set dept = 'business' where id = tests.id('cy') returning 1)
select is((select count(*) from u)::int, 0, 'a member cannot edit someone else''s profile');
with u as (update public.profiles set is_admin = true where id = tests.id('bob') returning 1)
select is((select count(*) from u)::int, 0, 'a member cannot promote themself');
select throws_ok($$ update public.profiles set must_change_password = false where id = tests.id('bob') $$,
  '42501', null, 'nobody can write must_change_password through the API');
select throws_ok($$ update public.profiles set username = 'root' where id = tests.id('bob') $$,
  '42501', null, 'nobody can rename a username through the API');

-- Admins that already exist in this database would make "last admin" untrue: sideline them here.
select tests.as_db();
update public.profiles set is_admin = false where is_admin and username not like 't\_%';
select tests.as_user(tests.id('ada'));
select throws_ok($$ update public.profiles set is_admin = false where id = tests.id('ada') $$,
  '23514', 'There must be at least one active admin', 'the last active admin cannot step down');
select lives_ok($$ update public.profiles set is_admin = true, role_title = 'Electrical lead' where id = tests.id('dee') $$,
  'an admin can promote a member');
select lives_ok($$ update public.profiles set is_admin = false where id = tests.id('dee') $$,
  'an admin can demote another admin while one remains');

-- ---------------------------------------------------------------------------
-- create_part
-- ---------------------------------------------------------------------------
select tests.as_user(tests.id('bob'));
select throws_ok($$ select public.create_part('Rail mount', 'electrical', tests.id('bob')) $$,
  '42501', 'Only admins can create parts', 'a member cannot create a part');

select tests.as_user(tests.id('ada'));
insert into tests.ctx (part_id)
select public.create_part('Motor mount', 'mechanical', tests.id('cy'), 'Mounts the motor',
  '2026-11-20', array[tests.id('bob'), tests.id('dee')]);

select tests.as_db();
select is((select count(*) from public.tasks where part_id = (select part_id from tests.ctx))::int, 12,
  'create_part makes the 12 workflow tasks');
select is((select count(*) from public.tasks
           where part_id = (select part_id from tests.ctx) and assignee_id = tests.id('cy'))::int, 7,
  'lead-owned steps go to the lead');
select is((select count(*) from public.tasks
           where part_id = (select part_id from tests.ctx) and assignee_id = tests.id('bob'))::int, 5,
  'team-owned steps go to the first team member');
select is((select count(*) from public.tasks
           where part_id = (select part_id from tests.ctx) and dept = 'mechanical')::int, 12,
  'every task takes the part''s department');
select is((select count(*) from public.notifications where kind = 'task_assigned' and user_id in (tests.id('cy'), tests.id('bob'), tests.id('dee')))::int, 0,
  'create_part does not spam one notification per task');
select is((select count(*) from public.notifications where kind = 'part_assigned' and user_id in (tests.id('cy'), tests.id('bob'), tests.id('dee')))::int, 3,
  'the lead and both team members get one part notification each');

select tests.as_user(tests.id('ada'));
select throws_ok(
  $$ select public.create_part('Hull', 'mechanical', tests.id('cy'), '', null,
       array[tests.id('bob'), tests.id('dee'), tests.id('ada')]) $$,
  '23514', 'A part team has at most 2 members', 'a team of three is rejected');
select throws_ok(
  $$ select public.create_part('Hull', 'mechanical', tests.id('cy'), '', null,
       array[tests.id('bob'), tests.id('bob')]) $$,
  '23514', 'Team members must be different people', 'duplicate team members are rejected');
select throws_ok(
  $$ insert into public.part_members (part_id, user_id)
     values ((select part_id from tests.ctx), tests.id('ada')) $$,
  '23514', 'A part team has at most 2 members', 'a third team member is rejected at the table too');

-- ---------------------------------------------------------------------------
-- tasks: who can add, change and delete
-- ---------------------------------------------------------------------------
select tests.as_user(tests.id('bob'));
select lives_ok($$ insert into public.tasks (dept, title) values ('electrical', 'Solder the sensor board') $$,
  'a member can add a standalone task to their own department');
select throws_ok($$ insert into public.tasks (dept, title) values ('mechanical', 'Sneaky') $$,
  '42501', null, 'but not to another department');
select throws_ok($$ insert into public.tasks (dept, title, created_by) values ('electrical', 'Spoof', tests.id('cy')) $$,
  '42501', null, 'and cannot credit a task to someone else');

select lives_ok(
  $$ update public.tasks set status = 'doing'
     where part_id = (select part_id from tests.ctx) and step_key = 'design' $$,
  'a team member can start a part task');
select is((select completed_at from public.tasks
           where part_id = (select part_id from tests.ctx) and step_key = 'design'),
  null::timestamptz, 'a task in progress has no completion time');

select tests.as_user(tests.id('eve'));
with u as (update public.tasks set status = 'doing'
           where part_id = (select part_id from tests.ctx) and step_key = 'manufacturing' returning 1)
select is((select count(*) from u)::int, 0, 'an outsider cannot update a part task');
select throws_ok(
  $$ insert into public.tasks (part_id, dept, title)
     values ((select part_id from tests.ctx), 'mechanical', 'Outsider task') $$,
  '42501', null, 'an outsider cannot add a task to a part');

-- blocked needs a reason, tells the lead, and clears when work resumes
select tests.as_user(tests.id('bob'));
select throws_ok(
  $$ update public.tasks set status = 'blocked'
     where part_id = (select part_id from tests.ctx) and step_key = 'design' $$,
  '23514', null, 'a blocked task needs a reason');
select lives_ok(
  $$ update public.tasks set status = 'blocked', blocked_reason = 'Waiting for the datasheet'
     where part_id = (select part_id from tests.ctx) and step_key = 'design' $$,
  'a task can be blocked with a reason');
select tests.as_user(tests.id('cy'));
select is((select count(*) from public.notifications where kind = 'task_blocked')::int, 1,
  'the part lead is told when a task is blocked');
select tests.as_user(tests.id('bob'));
select lives_ok(
  $$ update public.tasks set status = 'doing'
     where part_id = (select part_id from tests.ctx) and step_key = 'design' $$,
  'blocked work can resume');
select is((select blocked_reason from public.tasks
           where part_id = (select part_id from tests.ctx) and step_key = 'design'),
  null, 'leaving blocked clears the reason');

-- review gate
select tests.as_user(tests.id('ada'));
select lives_ok(
  $$ update public.tasks set reviewer_id = tests.id('cy')
     where part_id = (select part_id from tests.ctx) and step_key = 'design' $$,
  'an admin can set a reviewer');
select tests.as_user(tests.id('bob'));
select lives_ok(
  $$ update public.tasks set status = 'review'
     where part_id = (select part_id from tests.ctx) and step_key = 'design' $$,
  'the assignee can ask for review');
select tests.as_user(tests.id('cy'));
select is((select count(*) from public.notifications where kind = 'review_requested')::int, 1,
  'the reviewer is notified');
select tests.as_user(tests.id('bob'));
select throws_ok(
  $$ update public.tasks set status = 'done'
     where part_id = (select part_id from tests.ctx) and step_key = 'design' $$,
  '42501', 'Only the reviewer, the part lead or an admin can mark this task done',
  'the assignee cannot approve their own reviewed task');
select tests.as_user(tests.id('cy'));
select lives_ok(
  $$ update public.tasks set status = 'done', outcome = 'Approved'
     where part_id = (select part_id from tests.ctx) and step_key = 'design' $$,
  'the reviewer can mark it done');
select isnt((select completed_at from public.tasks
             where part_id = (select part_id from tests.ctx) and step_key = 'design'),
  null::timestamptz, 'done sets the completion time');
select throws_ok(
  $$ update public.tasks set part_id = null
     where part_id = (select part_id from tests.ctx) and step_key = 'design' $$,
  '42501', 'id, creator, part and step of a task cannot be changed',
  'a task cannot be moved out of its part');

-- assignment notifications and notification privacy
select tests.as_user(tests.id('bob'));
select lives_ok($$ update public.tasks set assignee_id = tests.id('dee') where title = 'Solder the sensor board' $$,
  'a task can be handed to a colleague');
select tests.as_user(tests.id('dee'));
select is((select count(*) from public.notifications where kind = 'task_assigned')::int, 1,
  'the new assignee is notified');
select is((select count(*) from public.notifications)::int, 2,
  'a member sees only their own notifications (part + task)');
select lives_ok($$ update public.notifications set read_at = now() $$,
  'members can mark their own notifications read');
select throws_ok($$ update public.notifications set kind = 'task_blocked' $$,
  '42501', null, 'but cannot change anything else on them');
select tests.as_db();
select is((select count(*) from public.notifications where read_at is not null and user_id = tests.id('dee'))::int, 2,
  'marking read touched only their own rows');

-- deleting
select tests.as_user(tests.id('dee'));
with d as (delete from public.tasks where title = 'Solder the sensor board' returning 1)
select is((select count(*) from d)::int, 0, 'the assignee cannot delete a task someone else created');
select tests.as_user(tests.id('bob'));
with d as (delete from public.tasks where title = 'Solder the sensor board' returning 1)
select is((select count(*) from d)::int, 1, 'the creator can delete their own todo task');

-- ---------------------------------------------------------------------------
-- contribution log
-- ---------------------------------------------------------------------------
select is((select count(*) from public.contribution_log
           where task = 'Design work' and status = 'done' and user_id = tests.id('bob'))::int, 1,
  'finished work shows up in the contribution log');
select is((select count(*) from public.contribution_log where status = 'todo')::int, 0,
  'tasks nobody started stay out of it');

-- ---------------------------------------------------------------------------
-- deactivation
-- ---------------------------------------------------------------------------
select tests.as_user(tests.id('ada'));
select lives_ok($$ update public.profiles set is_active = false where id = tests.id('eve') $$,
  'an admin can deactivate a member');
select throws_ok($$ select public.create_part('Ghost', 'business', tests.id('eve')) $$,
  '23514', 'The lead must be an active member', 'a deactivated member cannot lead a part');
select tests.as_user(tests.id('eve'));
select is((select count(*) from public.tasks)::int, 0, 'a deactivated member sees no tasks');
select is((select count(*) from public.profiles)::int, 0, 'and not the directory either');

-- ---------------------------------------------------------------------------
-- realtime
-- ---------------------------------------------------------------------------
select tests.as_db();
select ok(exists (select 1 from pg_publication_tables
                  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks'),
  'tasks stream over realtime');
select ok(exists (select 1 from pg_publication_tables
                  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'),
  'notifications stream over realtime');

select * from finish();
rollback;
