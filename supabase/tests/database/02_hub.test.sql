-- Access rules and business rules of the hub pages (announcements, ideas,
-- polls, events, assemblies, chat, meetings, boat, tools, namebook, handbook).
-- Run with: npx supabase test db   (needs the local stack: npx supabase start)
-- Everything happens in one transaction that is rolled back at the end.

begin;
create extension if not exists pgtap with schema extensions;
select * from no_plan();

-- ---------------------------------------------------------------------------
-- helpers (same shape as 01_organizer.test.sql)
-- ---------------------------------------------------------------------------
create schema tests;
grant usage on schema tests to anon, authenticated;

create function tests.id(n text) returns uuid language sql immutable as $$
  select ('b0000000-0000-0000-0000-00000000000' ||
    case n when 'ada' then '1' when 'fay' then '2' when 'bob' then '3'
           when 'cy' then '4' when 'eve' then '5' end)::uuid
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

create function tests.as_db() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', true);
end $$;

create table tests.ctx (k text primary key, id uuid);
grant all on tests.ctx to authenticated;
grant execute on all functions in schema tests to anon, authenticated;

-- ---------------------------------------------------------------------------
-- fixtures: ada (admin, electrical), fay (admin, mechanical), bob (electrical),
-- cy (mechanical), eve (business).
-- ---------------------------------------------------------------------------
insert into auth.users (id, aud, role, email, raw_app_meta_data) values
  (tests.id('ada'), 'authenticated', 'authenticated', 'h_ada@krakens.invalid',
   '{"username":"h_ada","full_name":"Ada Admin","dept":"electrical","is_admin":true}'),
  (tests.id('fay'), 'authenticated', 'authenticated', 'h_fay@krakens.invalid',
   '{"username":"h_fay","full_name":"Fay Head","dept":"mechanical","is_admin":true}'),
  (tests.id('bob'), 'authenticated', 'authenticated', 'h_bob@krakens.invalid',
   '{"username":"h_bob","full_name":"Bob Builder","dept":"electrical"}'),
  (tests.id('cy'), 'authenticated', 'authenticated', 'h_cy@krakens.invalid',
   '{"username":"h_cy","full_name":"Cy Mech","dept":"mechanical"}'),
  (tests.id('eve'), 'authenticated', 'authenticated', 'h_eve@krakens.invalid',
   '{"username":"h_eve","full_name":"Eve Biz","dept":"business"}');

-- ---------------------------------------------------------------------------
-- anonymous visitors get nothing
-- ---------------------------------------------------------------------------
select tests.as_anon();
select throws_ok($$ select count(*) from public.announcements $$, '42501', null,
  'anon cannot read announcements');
select throws_ok($$ select count(*) from public.chat_messages $$, '42501', null,
  'anon cannot read the chat');
select throws_ok($$ select public.create_poll('q', array['a', 'b']) $$, '42501', null,
  'anon cannot call create_poll');

-- ---------------------------------------------------------------------------
-- announcements and events: admins post, everyone reads
-- ---------------------------------------------------------------------------
select tests.as_user(tests.id('bob'));
select throws_ok($$ insert into public.announcements (title, body) values ('Hi', 'Hello') $$,
  '42501', null, 'a member cannot post an announcement');
select throws_ok($$ insert into public.events (starts_on, title) values ('2027-01-20', 'Boat show') $$,
  '42501', null, 'a member cannot add an event');

select tests.as_user(tests.id('ada'));
select lives_ok($$ insert into public.announcements (tag, title, body)
                   values ('urgent', 'Tool list', 'Fill it in this week') $$,
  'an admin posts an announcement');
select lives_ok($$ insert into public.events (starts_on, title, place)
                   values ('2027-07-08', 'Monaco Energy Boat Challenge', 'Monaco') $$,
  'an admin adds an event');

select tests.as_user(tests.id('eve'));
select is((select count(*) from public.announcements where title = 'Tool list')::int, 1,
  'every member reads announcements');
with d as (delete from public.announcements returning 1)
select is((select count(*) from d)::int, 0, 'a member cannot remove an announcement');

-- ---------------------------------------------------------------------------
-- ideas
-- ---------------------------------------------------------------------------
select tests.as_user(tests.id('bob'));
select lives_ok($$ insert into public.ideas (body, dept) values ('Build log videos', null) $$,
  'a member posts an idea for the whole team');
select throws_ok($$ insert into public.ideas (body, created_by) values ('Spoof', tests.id('cy')) $$,
  '42501', null, 'nobody posts an idea in someone else''s name');

select tests.as_user(tests.id('cy'));
select lives_ok($$ insert into public.idea_votes (idea_id, user_id)
                   select id, tests.id('cy') from public.ideas where body = 'Build log videos' $$,
  'a member upvotes an idea');
select throws_ok($$ insert into public.idea_votes (idea_id, user_id)
                    select id, tests.id('eve') from public.ideas where body = 'Build log videos' $$,
  '42501', null, 'nobody votes for someone else');
with d as (delete from public.ideas where body = 'Build log videos' returning 1)
select is((select count(*) from d)::int, 0, 'a member cannot remove someone else''s idea');

select tests.as_user(tests.id('bob'));
with d as (delete from public.ideas where body = 'Build log videos' returning 1)
select is((select count(*) from d)::int, 1, 'the author removes their own idea');

-- ---------------------------------------------------------------------------
-- polls
-- ---------------------------------------------------------------------------
select tests.as_user(tests.id('bob'));
select throws_ok($$ select public.create_poll('Hoodie colour', array['Navy', 'Red']) $$,
  '42501', 'Only admins can create polls', 'a member cannot create a poll');

select tests.as_user(tests.id('ada'));
select throws_ok($$ select public.create_poll('One option', array['Only', '  ']) $$,
  '23514', 'A poll needs 2 to 10 options', 'a poll needs at least two real options');
select throws_ok($$ select public.create_poll('Twice', array['Navy', 'navy']) $$,
  '23514', 'Poll options must be different', 'poll options must differ');
insert into tests.ctx values
  ('poll', public.create_poll('Hoodie colour', array['Navy', 'Red', 'Black'])),
  ('other', public.create_poll('Build night', array['Monday', 'Tuesday']));
select is((select count(*) from public.poll_options where poll_id = (select id from tests.ctx where k = 'poll'))::int, 3,
  'create_poll stores the options in order');

select tests.as_user(tests.id('cy'));
select lives_ok($$ insert into public.poll_votes (poll_id, user_id, option_id)
                   select o.poll_id, tests.id('cy'), o.id from public.poll_options o
                   where o.poll_id = (select id from tests.ctx where k = 'poll') and o.label = 'Navy' $$,
  'a member votes');
select lives_ok($$ update public.poll_votes set option_id = (
                     select id from public.poll_options
                     where poll_id = (select id from tests.ctx where k = 'poll') and label = 'Red')
                   where poll_id = (select id from tests.ctx where k = 'poll') $$,
  'and can change their vote');
select throws_ok($$ insert into public.poll_votes (poll_id, user_id, option_id)
                    select o.poll_id, tests.id('cy'), o.id from public.poll_options o
                    where o.poll_id = (select id from tests.ctx where k = 'poll') and o.label = 'Black' $$,
  '23505', null, 'one vote per member per poll');
select throws_ok($$ insert into public.poll_votes (poll_id, user_id, option_id)
                    select (select id from tests.ctx where k = 'other'), tests.id('cy'), o.id
                    from public.poll_options o
                    where o.poll_id = (select id from tests.ctx where k = 'poll') and o.label = 'Navy' $$,
  '23503', null, 'an option of another poll is rejected');
with u as (update public.polls set is_open = false returning 1)
select is((select count(*) from u)::int, 0, 'a member cannot close a poll');

select tests.as_user(tests.id('ada'));
update public.polls set is_open = false where id = (select id from tests.ctx where k = 'poll');
select tests.as_user(tests.id('eve'));
select throws_ok($$ insert into public.poll_votes (poll_id, user_id, option_id)
                    select o.poll_id, tests.id('eve'), o.id from public.poll_options o
                    where o.poll_id = (select id from tests.ctx where k = 'poll') and o.label = 'Navy' $$,
  '42501', null, 'nobody votes on a closed poll');

-- ---------------------------------------------------------------------------
-- general assemblies: planned once every active admin has approved
-- ---------------------------------------------------------------------------
select tests.as_user(tests.id('bob'));
select throws_ok($$ insert into public.assemblies (held_on, agenda) values ('2026-12-01', 'Updates') $$,
  '42501', null, 'a member cannot propose an assembly');

select tests.as_user(tests.id('ada'));
insert into public.assemblies (held_on, agenda) values ('2026-12-01', 'Department updates');
insert into tests.ctx select 'ga', id from public.assemblies where agenda = 'Department updates';
select is((select status::text from public.assemblies where id = (select id from tests.ctx where k = 'ga')), 'proposed',
  'a new assembly starts as proposed');
select is((select count(*) from public.assembly_approvals where assembly_id = (select id from tests.ctx where k = 'ga'))::int, 1,
  'the proposer approves by proposing');
select throws_ok($$ update public.assemblies set status = 'planned'
                    where id = (select id from tests.ctx where k = 'ga') $$,
  '23514', null, 'an admin cannot skip the approval round');

select tests.as_user(tests.id('fay'));
select is((select count(*) from public.notifications where kind = 'assembly_proposed')::int, 1,
  'the other department heads are notified');

select tests.as_user(tests.id('bob'));
select throws_ok($$ insert into public.assembly_approvals (assembly_id, user_id)
                    values ((select id from tests.ctx where k = 'ga'), tests.id('bob')) $$,
  '42501', null, 'a member cannot approve an assembly');

select tests.as_user(tests.id('fay'));
insert into public.assembly_approvals (assembly_id, user_id)
values ((select id from tests.ctx where k = 'ga'), tests.id('fay'));
select is((select status::text from public.assemblies where id = (select id from tests.ctx where k = 'ga')), 'planned',
  'the last approval plans the assembly');

select tests.as_user(tests.id('ada'));
update public.assemblies set status = 'proposed' where id = (select id from tests.ctx where k = 'ga');
select is((select array_agg(user_id) from public.assembly_approvals where assembly_id = (select id from tests.ctx where k = 'ga')),
  array[tests.id('ada')],
  're-proposing starts a new round that counts only the proposer''s approval');
select is((select status::text from public.assemblies where id = (select id from tests.ctx where k = 'ga')), 'proposed',
  'and waits for the other heads again');
select tests.as_user(tests.id('fay'));
select is((select count(*) from public.notifications where kind = 'assembly_proposed')::int, 2,
  'who are notified again');
select tests.as_user(tests.id('ada'));
select lives_ok($$ update public.assemblies set status = 'cancelled', summary = 'Exam season'
                   where id = (select id from tests.ctx where k = 'ga') $$,
  'an admin cancels an assembly and writes a note');

-- one live assembly per date; a cancelled one frees the date
select lives_ok($$ insert into public.assemblies (held_on, agenda) values ('2026-12-01', 'Second try') $$,
  'a cancelled assembly frees its date');
select throws_ok($$ insert into public.assemblies (held_on, agenda) values ('2026-12-01', 'Clash') $$,
  '23505', null, 'two live assemblies cannot share a date');
select throws_ok($$ update public.assemblies set status = 'proposed'
                    where id = (select id from tests.ctx where k = 'ga') $$,
  '23505', null, 'nor can a cancelled one come back onto a taken date');

-- ---------------------------------------------------------------------------
-- department chat
-- ---------------------------------------------------------------------------
select tests.as_user(tests.id('bob'));
select lives_ok($$ insert into public.chat_messages (dept, body) values ('electrical', 'Datasheets are up') $$,
  'a member writes in their department chat');
select throws_ok($$ insert into public.chat_messages (dept, body) values ('mechanical', 'Hi') $$,
  '42501', null, 'but not in another department''s chat');

select tests.as_user(tests.id('cy'));
select is((select count(*) from public.chat_messages)::int, 0,
  'another department cannot read the chat');
select tests.as_user(tests.id('fay'));
select is((select count(*) from public.chat_messages where dept = 'electrical')::int, 1,
  'admins read every department');

-- ---------------------------------------------------------------------------
-- meeting requests
-- ---------------------------------------------------------------------------
select tests.as_user(tests.id('bob'));
select lives_ok($$ insert into public.meeting_requests (dept, topic, meet_on, meet_at)
                   values ('electrical', 'Inverter wiring', '2026-11-02', '16:00') $$,
  'a member asks their department for a meeting');
select throws_ok($$ insert into public.meeting_requests (dept, topic, meet_on, meet_at)
                    values ('business', 'Sponsors', '2026-11-02', '16:00') $$,
  '42501', null, 'a member cannot ask another department');

select tests.as_user(tests.id('ada'));
select is((select count(*) from public.notifications where kind = 'meeting_requested')::int, 1,
  'the department is notified');
select tests.as_user(tests.id('fay'));
select is((select count(*) from public.notifications where kind = 'meeting_requested')::int, 1,
  'and every admin, also from other departments');
select tests.as_user(tests.id('cy'));
select is((select count(*) from public.notifications where kind = 'meeting_requested')::int, 0,
  'but not members of other departments');
select tests.as_user(tests.id('bob'));
select is((select count(*) from public.notifications where kind = 'meeting_requested')::int, 0,
  'nor the person who asked');
select tests.as_user(tests.id('cy'));
select is((select count(*) from public.meeting_requests)::int, 0,
  'other departments do not see the request');

-- ---------------------------------------------------------------------------
-- member details and onboarding
-- ---------------------------------------------------------------------------
select tests.as_user(tests.id('bob'));
select lives_ok($$ insert into public.member_details (user_id, studies, semester, dm_channel)
                   values (tests.id('bob'), 'BSc Electrical', 3, 'whatsapp')
                   on conflict (user_id) do update set studies = excluded.studies,
                     semester = excluded.semester, dm_channel = excluded.dm_channel $$,
  'a member saves their own details');
select throws_ok($$ insert into public.member_details (user_id, studies) values (tests.id('cy'), 'Spoof') $$,
  '42501', null, 'but not someone else''s');
select throws_ok($$ update public.member_details set semester = 13 where user_id = tests.id('bob') $$,
  '23514', null, 'the semester stays in range');
select lives_ok($$ insert into public.onboarding_progress (user_id, item) values (tests.id('bob'), 'wiki') $$,
  'a member ticks an onboarding item');

select tests.as_user(tests.id('cy'));
select is((select count(*) from public.member_details where user_id = tests.id('bob'))::int, 1,
  'details show in the directory');
select is((select count(*) from public.onboarding_progress)::int, 0,
  'onboarding progress is private');
select tests.as_user(tests.id('ada'));
select is((select count(*) from public.onboarding_progress where user_id = tests.id('bob'))::int, 1,
  'admins can follow onboarding');

-- ---------------------------------------------------------------------------
-- openings
-- ---------------------------------------------------------------------------
select tests.as_user(tests.id('ada'));
insert into public.openings (title, looking_for) values ('Battery systems', '1st semester electrical');
select tests.as_user(tests.id('bob'));
select is((select count(*) from public.openings)::int, 0, 'drafts are hidden from members');
select tests.as_user(tests.id('ada'));
update public.openings set status = 'open' where title = 'Battery systems';
select tests.as_user(tests.id('bob'));
select is((select count(*) from public.openings)::int, 1, 'a published opening is visible');

-- ---------------------------------------------------------------------------
-- tools, namebook, boat tracker
-- ---------------------------------------------------------------------------
select tests.as_user(tests.id('bob'));
select lives_ok($$ insert into public.tools (item, owner_id) values ('Multimeter', tests.id('bob')) $$,
  'a member lists their own tool');
select throws_ok($$ insert into public.tools (item, owner_id) values ('Drill', tests.id('cy')) $$,
  '42501', null, 'but not someone else''s');
select tests.as_user(tests.id('cy'));
with u as (update public.tools set status = 'borrowed' where item = 'Multimeter' returning 1)
select is((select count(*) from u)::int, 0, 'only the owner updates a tool');
select throws_ok($$ update public.tools set owner_id = tests.id('cy') $$,
  '42501', null, 'nobody hands a tool over through the API');
select tests.as_user(tests.id('ada'));
select lives_ok($$ insert into public.tools (item, owner_id) values ('Sander', tests.id('cy')) $$,
  'an admin lists a tool for a member');

select tests.as_user(tests.id('bob'));
select lives_ok($$ insert into public.namebook (person, context, known_by)
                   values ('Stefan', 'Component troubleshooting', tests.id('bob')) $$,
  'a member adds a contact');
select tests.as_user(tests.id('cy'));
with d as (delete from public.namebook returning 1)
select is((select count(*) from d)::int, 0, 'others cannot remove it');

select is((select count(*) from public.boat_components where status = 'confirmed')::int, 2,
  'the motor and power converters ship as confirmed');
select throws_ok($$ insert into public.boat_components (name) values ('Hull') $$,
  '42501', null, 'a member cannot edit the boat tracker');

-- ---------------------------------------------------------------------------
-- deactivated members see nothing
-- ---------------------------------------------------------------------------
select tests.as_user(tests.id('ada'));
update public.profiles set is_active = false where id = tests.id('eve');
select tests.as_user(tests.id('eve'));
select is((select count(*) from public.announcements)::int, 0, 'a deactivated member sees no announcements');
select is((select count(*) from public.events)::int, 0, 'nor events');

-- ---------------------------------------------------------------------------
-- a change in who is an admin re-checks proposed assemblies
-- ---------------------------------------------------------------------------
select tests.as_user(tests.id('ada'));
insert into public.assemblies (held_on, agenda) values ('2027-02-01', 'Waiting on Fay');
select is((select status::text from public.assemblies where agenda = 'Waiting on Fay'), 'proposed',
  'an assembly waits for every head');
update public.profiles set is_active = false where id = tests.id('fay');
select is((select status::text from public.assemblies where agenda = 'Waiting on Fay'), 'planned',
  'when the last missing head leaves, it is planned');
update public.profiles set is_admin = true where id = tests.id('bob');
select is((select status::text from public.assemblies where agenda = 'Waiting on Fay'), 'planned',
  'a new admin does not unplan an assembly that is already planned');
insert into public.assemblies (held_on, agenda) values ('2027-03-01', 'Needs Bob too');
select is((select status::text from public.assemblies where agenda = 'Needs Bob too'), 'proposed',
  'but new proposals need the new admin too');

select * from finish();
rollback;
