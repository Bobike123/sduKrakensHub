-- Krakens hub: core schema for the task organizer.
-- Tables only; access rules live in 20261015120100_security.sql and
-- business rules in 20261015120200_logic.sql.

create type public.dept as enum ('business', 'mechanical', 'electrical');
create type public.task_status as enum ('todo', 'doing', 'blocked', 'review', 'done', 'failed');
create type public.task_phase as enum ('planning', 'work', 'feedback');
create type public.step_owner as enum ('lead', 'team');
create type public.notification_kind as enum (
  'task_assigned', 'review_requested', 'task_blocked', 'part_assigned'
);

-- One row per member. Created by a trigger on auth.users (see logic migration);
-- members are deactivated, never deleted, so history stays attributable.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  full_name text not null,
  dept public.dept not null,
  role_title text not null default '',
  is_admin boolean not null default false,
  is_active boolean not null default true,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9][a-z0-9._-]{1,31}$'),
  constraint profiles_full_name_len check (char_length(btrim(full_name)) between 1 and 80),
  constraint profiles_role_title_len check (char_length(role_title) <= 80)
);
create unique index profiles_username_key on public.profiles (username);

-- A "part" of the boat. It is the project that tasks hang off.
create table public.parts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  dept public.dept not null,
  lead_id uuid not null references public.profiles (id),
  context text not null default '',
  deadline date,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parts_name_len check (char_length(btrim(name)) between 1 and 120),
  constraint parts_context_len check (char_length(context) <= 2000)
);
create index parts_dept_idx on public.parts (dept);
create index parts_lead_idx on public.parts (lead_id);
create index parts_created_by_idx on public.parts (created_by);

-- The working team of a part (at most 2, enforced by a trigger).
create table public.part_members (
  part_id uuid not null references public.parts (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  primary key (part_id, user_id)
);
create index part_members_user_idx on public.part_members (user_id);

-- The standard 12-step part workflow (from the prototype's PART_STEPS).
-- Reference data: changed through migrations only.
create table public.step_templates (
  key text primary key,
  phase public.task_phase not null,
  position smallint not null unique,
  title text not null,
  owner public.step_owner not null
);

insert into public.step_templates (key, phase, position, title, owner) values
  ('specs',         'planning', 1,  'Specifications (dimensions)',                   'lead'),
  ('expectations',  'planning', 2,  'Expectations: purpose, lifetime, options',      'lead'),
  ('timeline',      'planning', 3,  'Timeline and deadline',                         'lead'),
  ('context',       'planning', 4,  'Context: why this part, link to the big boat',  'lead'),
  ('contact',       'work',     5,  'Set a contact for help',                        'lead'),
  ('team',          'work',     6,  'Team of max 2 people',                          'team'),
  ('design',        'work',     7,  'Design work',                                   'team'),
  ('manufacturing', 'work',     8,  'Manufacturing',                                 'team'),
  ('assess',        'feedback', 9,  'Assess the part (multiple rounds)',             'lead'),
  ('implement',     'feedback', 10, 'Implement in the final system',                 'team'),
  ('documentation', 'feedback', 11, 'Part documentation',                            'team'),
  ('evaluation',    'feedback', 12, 'Personal evaluation',                           'lead');

-- A task is standalone (part_id null) or belongs to a part.
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  part_id uuid references public.parts (id) on delete cascade,
  dept public.dept not null,
  title text not null,
  description text not null default '',
  status public.task_status not null default 'todo',
  phase public.task_phase,
  step_key text references public.step_templates (key),
  assignee_id uuid references public.profiles (id),
  reviewer_id uuid references public.profiles (id),
  due_date date,
  blocked_reason text,
  outcome text not null default '',
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint tasks_title_len check (char_length(btrim(title)) between 1 and 160),
  constraint tasks_description_len check (char_length(description) <= 4000),
  constraint tasks_outcome_len check (char_length(outcome) <= 1000),
  constraint tasks_blocked_needs_reason
    check (status <> 'blocked' or char_length(btrim(coalesce(blocked_reason, ''))) > 0),
  constraint tasks_step_needs_part check (step_key is null or part_id is not null),
  constraint tasks_completed_matches_status
    check ((status in ('done', 'failed')) = (completed_at is not null))
);
create unique index tasks_part_step_key on public.tasks (part_id, step_key) where step_key is not null;
create index tasks_assignee_open_idx on public.tasks (assignee_id, due_date)
  where status not in ('done', 'failed');
create index tasks_dept_status_idx on public.tasks (dept, status);
create index tasks_part_idx on public.tasks (part_id);
create index tasks_reviewer_idx on public.tasks (reviewer_id) where reviewer_id is not null;
create index tasks_created_by_idx on public.tasks (created_by);

-- In-app notifications (the hub sends no email). Rows are written by triggers.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.notification_kind not null,
  task_id uuid references public.tasks (id) on delete cascade,
  part_id uuid references public.parts (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint notifications_has_target check (task_id is not null or part_id is not null)
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_task_idx on public.notifications (task_id) where task_id is not null;
create index notifications_part_idx on public.notifications (part_id) where part_id is not null;
create index notifications_actor_idx on public.notifications (actor_id) where actor_id is not null;
