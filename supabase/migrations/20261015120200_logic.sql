-- Krakens hub: business rules (triggers, RPC, views, realtime).
--
-- Trigger functions live in the private schema. Those that write across RLS
-- boundaries are SECURITY DEFINER with an empty search_path.

-- ---------------------------------------------------------------------------
-- Accounts: only an admin (service role) can create one. The profile row is
-- built from app_metadata, which a user cannot edit.
--
-- GoTrue's admin API inserts the user first and writes app_metadata in a
-- follow-up UPDATE inside the same transaction, so the profile is created on
-- INSERT *or* UPDATE of app_metadata. A deferred check then insists that every
-- user has a profile by COMMIT. That rejects a self sign-up (no metadata) even
-- if sign-ups are switched back on by mistake, and it means an account can
-- never be committed without a valid profile.
-- ---------------------------------------------------------------------------
create function private.sync_profile_from_auth_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
begin
  if exists (select 1 from public.profiles p where p.id = new.id) then
    return null;
  end if;
  if meta ->> 'username' is null or meta ->> 'full_name' is null or meta ->> 'dept' is null then
    return null; -- metadata may still be coming; require_profile enforces it at commit
  end if;

  insert into public.profiles (id, username, full_name, dept, role_title, is_admin)
  values (
    new.id,
    meta ->> 'username',
    meta ->> 'full_name',
    (meta ->> 'dept')::public.dept,
    coalesce(meta ->> 'role_title', ''),
    coalesce((meta ->> 'is_admin')::boolean, false)
  );
  return null;
end;
$$;

create trigger on_auth_user_created
  after insert or update of raw_app_meta_data on auth.users
  for each row execute function private.sync_profile_from_auth_user();

create function private.require_profile()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = new.id) then
    raise exception 'Accounts are created by an admin only' using errcode = '42501';
  end if;
  return null;
end;
$$;

-- Named to sort after on_auth_user_created, so the profile exists when this runs.
create constraint trigger on_auth_user_requires_profile
  after insert on auth.users
  deferrable initially deferred
  for each row execute function private.require_profile();

-- ---------------------------------------------------------------------------
-- profiles: identity is fixed, and the team always keeps one active admin.
-- ---------------------------------------------------------------------------
create function private.profiles_guard()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.id <> old.id or new.username <> old.username then
    raise exception 'id and username cannot be changed' using errcode = '42501';
  end if;

  if old.is_admin and old.is_active and not (new.is_admin and new.is_active) then
    -- serialise concurrent demotions so two admins cannot demote each other
    perform pg_advisory_xact_lock(hashtext('krakens.profiles_admin_guard'));
    if not exists (
      select 1 from public.profiles p
      where p.id <> old.id and p.is_admin and p.is_active
    ) then
      raise exception 'There must be at least one active admin' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard
  before update on public.profiles
  for each row execute function private.profiles_guard();

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create function private.touch_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger parts_touch
  before update on public.parts
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create function private.notify(
  p_user uuid, p_kind public.notification_kind, p_task uuid, p_part uuid, p_actor uuid
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  -- never notify people about their own actions, or deactivated members
  if p_user is null or p_user is not distinct from p_actor then
    return;
  end if;
  insert into public.notifications (user_id, kind, task_id, part_id, actor_id)
  select p.id, p_kind, p_task, p_part, p_actor
  from public.profiles p
  where p.id = p_user and p.is_active;
end;
$$;

-- ---------------------------------------------------------------------------
-- part teams: at most 2 members; added members are notified.
-- ---------------------------------------------------------------------------
create function private.part_members_guard()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  -- lock the part row so concurrent inserts cannot both slip past the count
  perform 1 from public.parts where id = new.part_id for update;
  if (select count(*) from public.part_members where part_id = new.part_id) >= 2 then
    raise exception 'A part team has at most 2 members' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger part_members_guard
  before insert on public.part_members
  for each row execute function private.part_members_guard();

create function private.part_member_added()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.notify(new.user_id, 'part_assigned', null, new.part_id, auth.uid());
  return null;
end;
$$;

create trigger part_member_added
  after insert on public.part_members
  for each row execute function private.part_member_added();

create function private.part_created()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.notify(new.lead_id, 'part_assigned', null, new.id, auth.uid());
  return null;
end;
$$;

create trigger part_created
  after insert on public.parts
  for each row execute function private.part_created();

-- ---------------------------------------------------------------------------
-- tasks: derived columns and transition rules.
-- ---------------------------------------------------------------------------
create function private.tasks_before_write()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if tg_op = 'UPDATE' then
    if new.id <> old.id
       or new.created_by <> old.created_by
       or new.part_id is distinct from old.part_id
       or new.step_key is distinct from old.step_key then
      raise exception 'id, creator, part and step of a task cannot be changed'
        using errcode = '42501';
    end if;
  end if;

  -- a part task always belongs to the part's department
  if new.part_id is not null then
    select p.dept into new.dept from public.parts p where p.id = new.part_id;
  end if;

  -- With a reviewer set, "done" is the reviewer's call (or the part lead's, or
  -- an admin's). Direct database access (no JWT) is not restricted.
  if new.status = 'done'
     and (tg_op = 'INSERT' or old.status <> 'done')
     and new.reviewer_id is not null
     and v_uid is not null
     and v_uid <> new.reviewer_id
     and not exists (select 1 from public.profiles p
                     where p.id = v_uid and p.is_admin and p.is_active)
     and not (new.part_id is not null
              and exists (select 1 from public.parts x
                          where x.id = new.part_id and x.lead_id = v_uid))
  then
    raise exception 'Only the reviewer, the part lead or an admin can mark this task done'
      using errcode = '42501';
  end if;

  if new.status in ('done', 'failed') then
    if tg_op = 'UPDATE' and old.status in ('done', 'failed') then
      new.completed_at := coalesce(old.completed_at, now());
    else
      new.completed_at := now();
    end if;
  else
    new.completed_at := null;
  end if;

  if new.status <> 'blocked' then
    new.blocked_reason := null;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger tasks_before_write
  before insert or update on public.tasks
  for each row execute function private.tasks_before_write();

create function private.tasks_notify()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_lead uuid;
begin
  -- create_part inserts 12 tasks at once and notifies once per person instead
  if coalesce(current_setting('app.skip_task_notifications', true), '') = 'on' then
    return null;
  end if;

  if new.part_id is not null then
    select p.lead_id into v_lead from public.parts p where p.id = new.part_id;
  end if;

  if new.assignee_id is not null
     and (tg_op = 'INSERT' or new.assignee_id is distinct from old.assignee_id) then
    perform private.notify(new.assignee_id, 'task_assigned', new.id, null, v_actor);
  end if;

  if new.status = 'review' and (tg_op = 'INSERT' or old.status <> 'review') then
    perform private.notify(coalesce(new.reviewer_id, v_lead), 'review_requested', new.id, null, v_actor);
  end if;

  if new.status = 'blocked' and (tg_op = 'INSERT' or old.status <> 'blocked') then
    perform private.notify(v_lead, 'task_blocked', new.id, null, v_actor);
  end if;

  return null;
end;
$$;

create trigger tasks_notify
  after insert or update on public.tasks
  for each row execute function private.tasks_notify();

-- ---------------------------------------------------------------------------
-- create_part: one atomic call makes the part, its team and the 12 workflow
-- tasks. Lead-owned steps go to the lead, team-owned steps to the first team
-- member. Admin only; the checks are inside because this bypasses RLS.
-- ---------------------------------------------------------------------------
create function public.create_part(
  p_name text,
  p_dept public.dept,
  p_lead_id uuid,
  p_context text default '',
  p_deadline date default null,
  p_team uuid[] default '{}'
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_team uuid[] := coalesce(p_team, '{}');
begin
  if not private.is_admin() then
    raise exception 'Only admins can create parts' using errcode = '42501';
  end if;
  if cardinality(v_team) > 2 then
    raise exception 'A part team has at most 2 members' using errcode = '23514';
  end if;
  if (select count(distinct m) from unnest(v_team) m) <> cardinality(v_team) then
    raise exception 'Team members must be different people' using errcode = '23514';
  end if;
  if not exists (select 1 from public.profiles p where p.id = p_lead_id and p.is_active) then
    raise exception 'The lead must be an active member' using errcode = '23514';
  end if;
  if exists (
    select 1 from unnest(v_team) m
    where not exists (select 1 from public.profiles p where p.id = m and p.is_active)
  ) then
    raise exception 'Team members must be active members' using errcode = '23514';
  end if;

  insert into public.parts (name, dept, lead_id, context, deadline, created_by)
  values (p_name, p_dept, p_lead_id, coalesce(p_context, ''), p_deadline, v_uid)
  returning id into v_id;

  insert into public.part_members (part_id, user_id)
  select v_id, m from unnest(v_team) m;

  perform set_config('app.skip_task_notifications', 'on', true);
  insert into public.tasks (part_id, dept, title, phase, step_key, assignee_id, created_by)
  select v_id, p_dept, t.title, t.phase, t.key,
         case t.owner when 'lead' then p_lead_id else v_team[1] end,
         v_uid
  from public.step_templates t
  order by t.position;
  perform set_config('app.skip_task_notifications', 'off', true);

  return v_id;
end;
$$;

revoke all on function public.create_part(text, public.dept, uuid, text, date, uuid[])
  from public, anon;
grant execute on function public.create_part(text, public.dept, uuid, text, date, uuid[])
  to authenticated;

-- ---------------------------------------------------------------------------
-- Contribution log: a view over the work people picked up, so nothing is
-- typed twice. security_invoker keeps the tasks RLS in force.
-- ---------------------------------------------------------------------------
create view public.contribution_log
with (security_invoker = true)
as
select
  t.id,
  t.assignee_id as user_id,
  t.title as task,
  t.status,
  t.outcome,
  t.part_id,
  t.dept,
  coalesce(t.completed_at, t.updated_at) as at
from public.tasks t
where t.assignee_id is not null
  and t.status in ('doing', 'review', 'done', 'failed');

revoke all on public.contribution_log from anon, authenticated;
grant select on public.contribution_log to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: the board and the notification bell update live. Realtime applies
-- the select policies above, so people only receive rows they may read.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.tasks, public.notifications;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Every function created above gets EXECUTE for PUBLIC by default, and anon
-- inherits it. Trigger functions are never called by clients. The helpers that
-- the security migration granted to authenticated keep that grant; this only
-- removes PUBLIC and anon. Do the same at the end of every new migration.
-- ---------------------------------------------------------------------------
revoke all on all functions in schema private from public, anon;
