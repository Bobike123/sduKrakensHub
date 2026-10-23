-- Krakens hub: privileges and row level security for the hub tables.
--
-- Same model as the organizer: every active member reads the team's content.
-- Admins (department heads) post announcements, events and polls, run
-- assemblies and edit the boat tracker. Members manage what they created
-- themselves. Department chat and meeting requests stay inside the department
-- (admins see every department).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function private.poll_is_open(p_poll uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.polls p where p.id = p_poll and p.is_open);
$$;

create function private.assembly_is_proposed(p_assembly uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.assemblies a where a.id = p_assembly and a.status = 'proposed'
  );
$$;

revoke all on function private.poll_is_open(uuid) from public, anon;
revoke all on function private.assembly_is_proposed(uuid) from public, anon;
grant execute on function private.poll_is_open(uuid) to authenticated;
grant execute on function private.assembly_is_proposed(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Table privileges. anon gets nothing; column grants keep fixed fields fixed.
-- ---------------------------------------------------------------------------
revoke all on public.member_details, public.onboarding_progress, public.openings,
  public.announcements, public.ideas, public.idea_votes, public.polls,
  public.poll_options, public.poll_votes, public.events, public.assemblies,
  public.assembly_approvals, public.chat_messages, public.meeting_requests,
  public.boat_components, public.tools, public.namebook
  from anon, authenticated;

grant select on public.member_details, public.onboarding_progress, public.openings,
  public.announcements, public.ideas, public.idea_votes, public.polls,
  public.poll_options, public.poll_votes, public.events, public.assemblies,
  public.assembly_approvals, public.chat_messages, public.meeting_requests,
  public.boat_components, public.tools, public.namebook
  to authenticated;

-- An upsert writes every column it sends, so these two get whole-row updates;
-- RLS pins user_id to the caller.
grant insert, update on public.member_details to authenticated;
grant insert, update on public.poll_votes to authenticated;
grant delete on public.poll_votes to authenticated;

grant insert, delete on public.onboarding_progress to authenticated;
grant insert, delete on public.openings to authenticated;
grant update (title, looking_for, description, status) on public.openings to authenticated;
grant insert, delete on public.announcements to authenticated;
grant insert, delete on public.ideas to authenticated;
grant insert, delete on public.idea_votes to authenticated;
-- polls are created by create_poll(); admins can open, close and delete them
grant update (is_open) on public.polls to authenticated;
grant delete on public.polls to authenticated;
grant insert, delete on public.events to authenticated;
grant update (starts_on, title, place, description) on public.events to authenticated;
grant insert, delete on public.assemblies to authenticated;
grant update (held_on, agenda, status, summary) on public.assemblies to authenticated;
grant insert, delete on public.assembly_approvals to authenticated;
grant insert, delete on public.chat_messages to authenticated;
grant insert, delete on public.meeting_requests to authenticated;
grant insert, delete on public.boat_components to authenticated;
grant update (name, detail, status, position) on public.boat_components to authenticated;
grant insert, delete on public.tools to authenticated;
grant update (item, status) on public.tools to authenticated;
grant insert, delete on public.namebook to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.member_details enable row level security;
alter table public.onboarding_progress enable row level security;
alter table public.openings enable row level security;
alter table public.announcements enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_votes enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.events enable row level security;
alter table public.assemblies enable row level security;
alter table public.assembly_approvals enable row level security;
alter table public.chat_messages enable row level security;
alter table public.meeting_requests enable row level security;
alter table public.boat_components enable row level security;
alter table public.tools enable row level security;
alter table public.namebook enable row level security;

-- member_details: the directory shows them; you edit only your own.
create policy member_details_select on public.member_details
  for select to authenticated
  using ((select private.is_member()));

create policy member_details_insert on public.member_details
  for insert to authenticated
  with check ((select private.is_member()) and user_id = (select auth.uid()));

create policy member_details_update on public.member_details
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check ((select private.is_member()) and user_id = (select auth.uid()));

-- onboarding_progress: private to you, admins can follow along.
create policy onboarding_progress_select on public.onboarding_progress
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

create policy onboarding_progress_insert on public.onboarding_progress
  for insert to authenticated
  with check ((select private.is_member()) and user_id = (select auth.uid()));

create policy onboarding_progress_delete on public.onboarding_progress
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- openings: drafts are for admins until published.
create policy openings_select on public.openings
  for select to authenticated
  using ((select private.is_member()) and (status <> 'draft' or (select private.is_admin())));

create policy openings_insert on public.openings
  for insert to authenticated
  with check ((select private.is_admin()) and created_by = (select auth.uid()));

create policy openings_update on public.openings
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy openings_delete on public.openings
  for delete to authenticated
  using ((select private.is_admin()));

-- announcements
create policy announcements_select on public.announcements
  for select to authenticated
  using ((select private.is_member()));

create policy announcements_insert on public.announcements
  for insert to authenticated
  with check ((select private.is_admin()) and created_by = (select auth.uid()));

create policy announcements_delete on public.announcements
  for delete to authenticated
  using ((select private.is_admin()));

-- ideas: anyone posts; the author or an admin removes.
create policy ideas_select on public.ideas
  for select to authenticated
  using ((select private.is_member()));

create policy ideas_insert on public.ideas
  for insert to authenticated
  with check ((select private.is_member()) and created_by = (select auth.uid()));

create policy ideas_delete on public.ideas
  for delete to authenticated
  using (created_by = (select auth.uid()) or (select private.is_admin()));

create policy idea_votes_select on public.idea_votes
  for select to authenticated
  using ((select private.is_member()));

create policy idea_votes_insert on public.idea_votes
  for insert to authenticated
  with check ((select private.is_member()) and user_id = (select auth.uid()));

create policy idea_votes_delete on public.idea_votes
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- polls
create policy polls_select on public.polls
  for select to authenticated
  using ((select private.is_member()));

create policy polls_update on public.polls
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy polls_delete on public.polls
  for delete to authenticated
  using ((select private.is_admin()));

create policy poll_options_select on public.poll_options
  for select to authenticated
  using ((select private.is_member()));

-- Votes: your own, and only while the poll is open.
create policy poll_votes_select on public.poll_votes
  for select to authenticated
  using ((select private.is_member()));

create policy poll_votes_insert on public.poll_votes
  for insert to authenticated
  with check (
    (select private.is_member()) and user_id = (select auth.uid()) and private.poll_is_open(poll_id)
  );

create policy poll_votes_update on public.poll_votes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    (select private.is_member()) and user_id = (select auth.uid()) and private.poll_is_open(poll_id)
  );

create policy poll_votes_delete on public.poll_votes
  for delete to authenticated
  using (user_id = (select auth.uid()) and private.poll_is_open(poll_id));

-- events
create policy events_select on public.events
  for select to authenticated
  using ((select private.is_member()));

create policy events_insert on public.events
  for insert to authenticated
  with check ((select private.is_admin()) and created_by = (select auth.uid()));

create policy events_update on public.events
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy events_delete on public.events
  for delete to authenticated
  using ((select private.is_admin()));

-- assemblies: admins propose, approve, cancel and write the summary.
create policy assemblies_select on public.assemblies
  for select to authenticated
  using ((select private.is_member()));

create policy assemblies_insert on public.assemblies
  for insert to authenticated
  with check ((select private.is_admin()) and created_by = (select auth.uid()));

create policy assemblies_update on public.assemblies
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy assemblies_delete on public.assemblies
  for delete to authenticated
  using ((select private.is_admin()));

create policy assembly_approvals_select on public.assembly_approvals
  for select to authenticated
  using ((select private.is_member()));

create policy assembly_approvals_insert on public.assembly_approvals
  for insert to authenticated
  with check (
    (select private.is_admin()) and user_id = (select auth.uid())
    and private.assembly_is_proposed(assembly_id)
  );

create policy assembly_approvals_delete on public.assembly_approvals
  for delete to authenticated
  using (user_id = (select auth.uid()) and private.assembly_is_proposed(assembly_id));

-- chat: your department, or every department for admins.
create policy chat_messages_select on public.chat_messages
  for select to authenticated
  using (
    (select private.is_member())
    and (dept = (select private.my_dept()) or (select private.is_admin()))
  );

create policy chat_messages_insert on public.chat_messages
  for insert to authenticated
  with check (
    (select private.is_member()) and user_id = (select auth.uid())
    and (dept = (select private.my_dept()) or (select private.is_admin()))
  );

create policy chat_messages_delete on public.chat_messages
  for delete to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- meeting requests: the department sees them, plus whoever asked.
create policy meeting_requests_select on public.meeting_requests
  for select to authenticated
  using (
    (select private.is_member())
    and (
      dept = (select private.my_dept())
      or created_by = (select auth.uid())
      or (select private.is_admin())
    )
  );

create policy meeting_requests_insert on public.meeting_requests
  for insert to authenticated
  with check (
    (select private.is_member()) and created_by = (select auth.uid())
    and (dept = (select private.my_dept()) or (select private.is_admin()))
  );

create policy meeting_requests_delete on public.meeting_requests
  for delete to authenticated
  using (created_by = (select auth.uid()) or (select private.is_admin()));

-- boat tracker
create policy boat_components_select on public.boat_components
  for select to authenticated
  using ((select private.is_member()));

create policy boat_components_insert on public.boat_components
  for insert to authenticated
  with check ((select private.is_admin()));

create policy boat_components_update on public.boat_components
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy boat_components_delete on public.boat_components
  for delete to authenticated
  using ((select private.is_admin()));

-- tools: you list your own; admins can list one for anybody.
create policy tools_select on public.tools
  for select to authenticated
  using ((select private.is_member()));

create policy tools_insert on public.tools
  for insert to authenticated
  with check (
    (select private.is_member()) and created_by = (select auth.uid())
    and (owner_id = (select auth.uid()) or (select private.is_admin()))
  );

create policy tools_update on public.tools
  for update to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()))
  with check ((select private.is_member()));

create policy tools_delete on public.tools
  for delete to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()));

-- namebook: anyone adds; the person who knows them, the author or an admin removes.
create policy namebook_select on public.namebook
  for select to authenticated
  using ((select private.is_member()));

create policy namebook_insert on public.namebook
  for insert to authenticated
  with check ((select private.is_member()) and created_by = (select auth.uid()));

create policy namebook_delete on public.namebook
  for delete to authenticated
  using (
    known_by = (select auth.uid())
    or created_by = (select auth.uid())
    or (select private.is_admin())
  );
