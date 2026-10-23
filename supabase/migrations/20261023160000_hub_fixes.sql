-- Krakens hub: logic fixes from the 2026-10-23 review.
--   1. A change in who is an active admin re-checks proposed assemblies.
--   2. "Propose again" counts as the proposer's approval and notifies the other
--      heads, the same as a new proposal.
--   3. Meeting requests also notify every admin, as in the prototype.
--   4. Only one live (not cancelled) assembly per date.

-- ---------------------------------------------------------------------------
-- 4. One live assembly per date. A cancelled one frees its date.
-- ---------------------------------------------------------------------------
create unique index assemblies_live_date_key on public.assemblies (held_on)
  where status <> 'cancelled';

-- ---------------------------------------------------------------------------
-- 3. Meeting requests reach the department and every admin.
-- ---------------------------------------------------------------------------
create or replace function private.meeting_requested()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.notify_about(p.id, 'meeting_requested', new.created_by, new.id, null)
  from public.profiles p
  where (p.dept = new.dept or p.is_admin) and p.is_active;
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. "Planned" means every active admin approved, so a change in who that is
-- re-checks the assemblies still waiting. Planned ones stay planned.
-- ---------------------------------------------------------------------------
create function private.resync_proposed_assemblies()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  r record;
begin
  if (old.is_admin and old.is_active) is not distinct from (new.is_admin and new.is_active) then
    return null;
  end if;
  for r in select a.id from public.assemblies a where a.status = 'proposed' loop
    perform private.sync_assembly_status(r.id);
  end loop;
  return null;
end;
$$;

create trigger profiles_admin_changed
  after update of is_admin, is_active on public.profiles
  for each row execute function private.resync_proposed_assemblies();

-- ---------------------------------------------------------------------------
-- 2. Proposing again (from planned or cancelled) behaves like proposing: the
-- proposer's approval counts and the other heads hear about it. An AFTER
-- trigger, because the approval's own trigger updates this same row.
-- ---------------------------------------------------------------------------
create function private.assembly_reproposed()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  -- status changes made by sync_assembly_status are not a new proposal
  if new.status <> 'proposed' or old.status = 'proposed'
     or coalesce(current_setting('app.assembly_sync', true), '') = 'on' then
    return null;
  end if;

  if exists (select 1 from public.profiles p where p.id = v_uid and p.is_admin and p.is_active) then
    insert into public.assembly_approvals (assembly_id, user_id)
    values (new.id, v_uid)
    on conflict do nothing;
  end if;

  perform private.notify_about(p.id, 'assembly_proposed', v_uid, null, new.id)
  from public.profiles p
  where p.is_admin and p.is_active;
  return null;
end;
$$;

create trigger assembly_reproposed
  after update of status on public.assemblies
  for each row execute function private.assembly_reproposed();

-- ---------------------------------------------------------------------------
-- See the note at the end of 20261015120200_logic.sql.
-- ---------------------------------------------------------------------------
revoke all on all functions in schema private from public, anon;
