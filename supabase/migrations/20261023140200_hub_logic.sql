-- Krakens hub: business rules for the hub tables (triggers and RPC).
-- Same conventions as 20261015120200_logic.sql: functions in private, SECURITY
-- DEFINER with an empty search_path where they write across RLS boundaries.

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create trigger member_details_touch
  before update on public.member_details
  for each row execute function private.touch_updated_at();

create trigger assemblies_touch
  before update on public.assemblies
  for each row execute function private.touch_updated_at();

create trigger tools_touch
  before update on public.tools
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Notifications about meetings and assemblies. private.notify() only knows
-- tasks and parts, so this is its sibling for the hub's targets.
-- ---------------------------------------------------------------------------
create function private.notify_about(
  p_user uuid, p_kind public.notification_kind, p_actor uuid,
  p_meeting uuid default null, p_assembly uuid default null
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_user is null or p_user is not distinct from p_actor then
    return;
  end if;
  insert into public.notifications (user_id, kind, actor_id, meeting_id, assembly_id)
  select p.id, p_kind, p_actor, p_meeting, p_assembly
  from public.profiles p
  where p.id = p_user and p.is_active;
end;
$$;

-- Everyone in the department hears about a meeting request.
create function private.meeting_requested()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.notify_about(p.id, 'meeting_requested', new.created_by, new.id, null)
  from public.profiles p
  where p.dept = new.dept and p.is_active;
  return null;
end;
$$;

create trigger meeting_requested
  after insert on public.meeting_requests
  for each row execute function private.meeting_requested();

-- ---------------------------------------------------------------------------
-- Polls: a poll and its options are created together, by an admin.
-- ---------------------------------------------------------------------------
create function public.create_poll(p_question text, p_options text[])
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_options text[];
begin
  if not private.is_admin() then
    raise exception 'Only admins can create polls' using errcode = '42501';
  end if;

  select coalesce(array_agg(btrim(o) order by n), '{}') into v_options
  from unnest(p_options) with ordinality as x(o, n)
  where btrim(o) <> '';

  if cardinality(v_options) < 2 or cardinality(v_options) > 10 then
    raise exception 'A poll needs 2 to 10 options' using errcode = '23514';
  end if;
  if (select count(distinct lower(o)) from unnest(v_options) o) <> cardinality(v_options) then
    raise exception 'Poll options must be different' using errcode = '23514';
  end if;

  insert into public.polls (question, created_by)
  values (p_question, auth.uid())
  returning id into v_id;

  insert into public.poll_options (poll_id, position, label)
  select v_id, n, o from unnest(v_options) with ordinality as x(o, n);

  return v_id;
end;
$$;

revoke all on function public.create_poll(text, text[]) from public, anon;
grant execute on function public.create_poll(text, text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- General assemblies. An assembly is planned once every active admin has
-- approved it. The proposer approves by proposing, and the other admins are
-- notified. Only this sync may set "planned"; admins can cancel or re-propose.
-- ---------------------------------------------------------------------------
create function private.sync_assembly_status(p_assembly uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_all_approved boolean;
begin
  select not exists (
    select 1 from public.profiles p
    where p.is_admin and p.is_active
      and not exists (
        select 1 from public.assembly_approvals x
        where x.assembly_id = p_assembly and x.user_id = p.id
      )
  ) into v_all_approved;

  perform set_config('app.assembly_sync', 'on', true);
  update public.assemblies
  set status = case when v_all_approved then 'planned' else 'proposed' end::public.assembly_status
  where id = p_assembly and status in ('proposed', 'planned');
  perform set_config('app.assembly_sync', 'off', true);
end;
$$;

create function private.assemblies_guard()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'planned' and old.status <> 'planned'
     and coalesce(current_setting('app.assembly_sync', true), '') <> 'on' then
    raise exception 'An assembly is planned once every department head approves it'
      using errcode = '23514';
  end if;
  -- Going back to "proposed" starts the approval round again. The flag stops
  -- those deletes from re-syncing the row this trigger is still updating.
  if new.status = 'proposed' and old.status <> 'proposed'
     and coalesce(current_setting('app.assembly_sync', true), '') <> 'on' then
    perform set_config('app.assembly_reset', 'on', true);
    delete from public.assembly_approvals where assembly_id = new.id;
    perform set_config('app.assembly_reset', 'off', true);
  end if;
  return new;
end;
$$;

create trigger assemblies_guard
  before update on public.assemblies
  for each row execute function private.assemblies_guard();

create function private.assembly_proposed()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.assembly_approvals (assembly_id, user_id)
  values (new.id, new.created_by)
  on conflict do nothing;

  perform private.notify_about(p.id, 'assembly_proposed', new.created_by, null, new.id)
  from public.profiles p
  where p.is_admin and p.is_active;
  return null;
end;
$$;

create trigger assembly_proposed
  after insert on public.assemblies
  for each row execute function private.assembly_proposed();

create function private.assembly_approvals_changed()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if coalesce(current_setting('app.assembly_reset', true), '') = 'on' then
    return null;
  end if;
  perform private.sync_assembly_status(coalesce(new.assembly_id, old.assembly_id));
  return null;
end;
$$;

create trigger assembly_approvals_changed
  after insert or delete on public.assembly_approvals
  for each row execute function private.assembly_approvals_changed();

-- ---------------------------------------------------------------------------
-- See the note at the end of 20261015120200_logic.sql.
-- ---------------------------------------------------------------------------
revoke all on all functions in schema private from public, anon;
