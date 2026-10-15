-- Krakens hub: privileges and row level security.
--
-- Model: nobody is anonymous. Every signed-in, active member can read the whole
-- organizer (it is a 15-person team). Writes are limited by role:
--   admin  = department head, may do everything
--   lead   = lead of a part
--   team   = member of a part's team
-- RLS is the enforcement layer; the SvelteKit server also validates input.

-- ---------------------------------------------------------------------------
-- Helper functions live in a schema the Data API does not expose.
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- Supabase's default privileges hand every new table, sequence and function in
-- public to anon and authenticated. Cancel that so each object is granted
-- explicitly. EXECUTE for PUBLIC is a separate built-in default that cannot be
-- cancelled per schema (anon inherits it), so every function revokes it itself
-- and a database test fails if any function in public or private leaks.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated;

create function private.is_member()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_active
  );
$$;

create function private.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.is_active and p.is_admin
  );
$$;

create function private.my_dept()
returns public.dept
language sql stable security definer set search_path = ''
as $$
  select p.dept from public.profiles p
  where p.id = (select auth.uid()) and p.is_active;
$$;

create function private.is_part_lead(p_part uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.parts x
    where x.id = p_part and x.lead_id = (select auth.uid())
  );
$$;

-- Lead or team member of the part.
create function private.is_part_member(p_part uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.parts x
    where x.id = p_part and x.lead_id = (select auth.uid())
  ) or exists (
    select 1 from public.part_members m
    where m.part_id = p_part and m.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_member() from public, anon;
revoke all on function private.is_admin() from public, anon;
revoke all on function private.my_dept() from public, anon;
revoke all on function private.is_part_lead(uuid) from public, anon;
revoke all on function private.is_part_member(uuid) from public, anon;
grant execute on function private.is_member() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.my_dept() to authenticated;
grant execute on function private.is_part_lead(uuid) to authenticated;
grant execute on function private.is_part_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Table privileges: anon gets nothing; authenticated gets the minimum, and
-- column-level grants keep people from editing fields they must not touch.
-- ---------------------------------------------------------------------------
revoke all on public.profiles, public.parts, public.part_members,
  public.step_templates, public.tasks, public.notifications
  from anon, authenticated;

grant select on public.profiles, public.parts, public.part_members,
  public.step_templates, public.tasks, public.notifications to authenticated;

-- Admins edit these columns (RLS restricts who). username, id and
-- must_change_password are never writable through the API.
grant update (full_name, dept, role_title, is_admin, is_active) on public.profiles to authenticated;

grant insert, update, delete on public.parts to authenticated;
grant insert, delete on public.part_members to authenticated;
grant insert, update, delete on public.tasks to authenticated;

-- Members can only mark their own notifications read.
grant update (read_at) on public.notifications to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.parts enable row level security;
alter table public.part_members enable row level security;
alter table public.step_templates enable row level security;
alter table public.tasks enable row level security;
alter table public.notifications enable row level security;

-- profiles: everyone reads the directory; only admins edit it. Inserts come
-- from the auth.users trigger and the service role, never from the API.
create policy profiles_select on public.profiles
  for select to authenticated
  using ((select private.is_member()));

create policy profiles_admin_update on public.profiles
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy step_templates_select on public.step_templates
  for select to authenticated
  using ((select private.is_member()));

-- parts
create policy parts_select on public.parts
  for select to authenticated
  using ((select private.is_member()));

create policy parts_insert on public.parts
  for insert to authenticated
  with check ((select private.is_admin()) and created_by = (select auth.uid()));

create policy parts_update on public.parts
  for update to authenticated
  using ((select private.is_admin()) or private.is_part_lead(id))
  with check ((select private.is_admin()) or private.is_part_lead(id));

create policy parts_delete on public.parts
  for delete to authenticated
  using ((select private.is_admin()));

-- part_members
create policy part_members_select on public.part_members
  for select to authenticated
  using ((select private.is_member()));

create policy part_members_insert on public.part_members
  for insert to authenticated
  with check ((select private.is_admin()) or private.is_part_lead(part_id));

create policy part_members_delete on public.part_members
  for delete to authenticated
  using ((select private.is_admin()) or private.is_part_lead(part_id));

-- tasks
create policy tasks_select on public.tasks
  for select to authenticated
  using ((select private.is_member()));

-- Anyone can add a standalone task to their own department. Part tasks need
-- an admin, the part's lead, or its team.
create policy tasks_insert on public.tasks
  for insert to authenticated
  with check (
    (select private.is_member())
    and created_by = (select auth.uid())
    and (
      (part_id is null and (dept = (select private.my_dept()) or (select private.is_admin())))
      or (part_id is not null
          and ((select private.is_admin()) or private.is_part_member(part_id)))
    )
  );

create policy tasks_update on public.tasks
  for update to authenticated
  using (
    (select private.is_member())
    and (
      (select private.is_admin())
      or assignee_id = (select auth.uid())
      or reviewer_id = (select auth.uid())
      or created_by = (select auth.uid())
      or (part_id is not null and private.is_part_member(part_id))
    )
  )
  with check ((select private.is_member()));

create policy tasks_delete on public.tasks
  for delete to authenticated
  using (
    (select private.is_admin())
    or (created_by = (select auth.uid()) and status = 'todo')
    or (part_id is not null and private.is_part_lead(part_id))
  );

-- notifications: you only ever see and mark your own.
create policy notifications_select on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy notifications_mark_read on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
