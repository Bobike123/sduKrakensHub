-- Krakens hub: the rest of the team hub from the v1 prototype. Announcements,
-- the idea bank, polls, events, general assemblies, department chat, meeting
-- requests, the boat tracker, the tool list, the namebook and the handbook's
-- live parts (openings, onboarding), plus the details members edit themselves.
-- Same split as the organizer: tables here, access rules in
-- 20261023140100_hub_security.sql, business rules in 20261023140200_hub_logic.sql.

create type public.announcement_tag as enum ('info', 'urgent', 'event');
create type public.assembly_status as enum ('proposed', 'planned', 'cancelled');
create type public.tool_status as enum ('workshop', 'borrowed', 'home');
create type public.component_status as enum ('confirmed', 'planned');
create type public.dm_channel as enum ('whatsapp', 'teams', 'email', 'phone');
create type public.opening_status as enum ('draft', 'open', 'closed');

-- Only function bodies (parsed when they run) use these values, never this
-- migration itself, so adding them inside its transaction is safe.
alter type public.notification_kind add value if not exists 'meeting_requested';
alter type public.notification_kind add value if not exists 'assembly_proposed';

-- What a member fills in about themself. Kept apart from profiles, which only
-- admins may edit, so a member can never reach their own dept or admin flag.
create table public.member_details (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  studies text not null default '',
  semester smallint,
  dm_channel public.dm_channel,
  updated_at timestamptz not null default now(),
  constraint member_details_studies_len check (char_length(studies) <= 80),
  constraint member_details_semester_range check (semester between 1 and 12)
);

-- Ticked items of the onboarding checklist. The list itself lives in the app.
create table public.onboarding_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item text not null,
  done_at timestamptz not null default now(),
  primary key (user_id, item),
  constraint onboarding_progress_item_format check (item ~ '^[a-z]{2,20}$')
);

-- Open positions in the handbook's hiring tab.
create table public.openings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  looking_for text not null,
  description text not null default '',
  status public.opening_status not null default 'draft',
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint openings_title_len check (char_length(btrim(title)) between 1 and 120),
  constraint openings_looking_for_len check (char_length(btrim(looking_for)) between 1 and 160),
  constraint openings_description_len check (char_length(description) <= 2000)
);
create index openings_created_by_idx on public.openings (created_by);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  tag public.announcement_tag not null default 'info',
  title text not null,
  body text not null,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint announcements_title_len check (char_length(btrim(title)) between 1 and 120),
  constraint announcements_body_len check (char_length(btrim(body)) between 1 and 4000)
);
create index announcements_created_at_idx on public.announcements (created_at desc);
create index announcements_created_by_idx on public.announcements (created_by);

-- Idea bank. dept null means "all team".
create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  dept public.dept,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint ideas_body_len check (char_length(btrim(body)) between 1 and 280)
);
create index ideas_created_by_idx on public.ideas (created_by);

create table public.idea_votes (
  idea_id uuid not null references public.ideas (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (idea_id, user_id)
);
create index idea_votes_user_idx on public.idea_votes (user_id);

-- Polls. Made with create_poll() so a poll and its options appear together.
create table public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  is_open boolean not null default true,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint polls_question_len check (char_length(btrim(question)) between 1 and 200)
);
create index polls_created_by_idx on public.polls (created_by);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  position smallint not null,
  label text not null,
  constraint poll_options_label_len check (char_length(btrim(label)) between 1 and 120),
  constraint poll_options_position_key unique (poll_id, position),
  -- target of the composite foreign key below
  constraint poll_options_id_poll_key unique (id, poll_id)
);

-- One vote per member per poll; changing your mind updates the row. The
-- composite key makes it impossible to vote for an option of another poll.
create table public.poll_votes (
  poll_id uuid not null references public.polls (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  option_id uuid not null,
  voted_at timestamptz not null default now(),
  primary key (poll_id, user_id),
  constraint poll_votes_option_fkey foreign key (option_id, poll_id)
    references public.poll_options (id, poll_id) on delete cascade
);
create index poll_votes_option_idx on public.poll_votes (option_id, poll_id);
create index poll_votes_user_idx on public.poll_votes (user_id);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  starts_on date not null,
  title text not null,
  place text not null default '',
  description text not null default '',
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint events_title_len check (char_length(btrim(title)) between 1 and 120),
  constraint events_place_len check (char_length(place) <= 120),
  constraint events_description_len check (char_length(description) <= 1000)
);
create index events_starts_on_idx on public.events (starts_on);
create index events_created_by_idx on public.events (created_by);

-- General assemblies. One is planned once every active admin (the department
-- heads) has approved it; the logic migration keeps status in step.
create table public.assemblies (
  id uuid primary key default gen_random_uuid(),
  held_on date not null,
  agenda text not null,
  status public.assembly_status not null default 'proposed',
  summary text not null default '',
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assemblies_agenda_len check (char_length(btrim(agenda)) between 1 and 300),
  constraint assemblies_summary_len check (char_length(summary) <= 8000)
);
create index assemblies_held_on_idx on public.assemblies (held_on);
create index assemblies_created_by_idx on public.assemblies (created_by);

create table public.assembly_approvals (
  assembly_id uuid not null references public.assemblies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  approved_at timestamptz not null default now(),
  primary key (assembly_id, user_id)
);
create index assembly_approvals_user_idx on public.assembly_approvals (user_id);

-- Department chat. Members read and write their own department; admins all.
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  dept public.dept not null,
  user_id uuid not null default auth.uid() references public.profiles (id),
  body text not null,
  created_at timestamptz not null default now(),
  constraint chat_messages_body_len check (char_length(btrim(body)) between 1 and 2000)
);
create index chat_messages_dept_idx on public.chat_messages (dept, created_at desc);
create index chat_messages_user_idx on public.chat_messages (user_id);

-- A request for a department meeting. Everyone in the department is notified.
create table public.meeting_requests (
  id uuid primary key default gen_random_uuid(),
  dept public.dept not null,
  topic text not null,
  meet_on date not null,
  meet_at time not null,
  note text not null default '',
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint meeting_requests_topic_len check (char_length(btrim(topic)) between 1 and 120),
  constraint meeting_requests_note_len check (char_length(note) <= 200)
);
create index meeting_requests_dept_idx on public.meeting_requests (dept, created_at desc);
create index meeting_requests_created_by_idx on public.meeting_requests (created_by);

-- What is confirmed on the boat. Shown on the boat tracker.
create table public.boat_components (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  detail text not null default '',
  status public.component_status not null default 'planned',
  position smallint not null default 100,
  created_at timestamptz not null default now(),
  constraint boat_components_name_len check (char_length(btrim(name)) between 1 and 80),
  constraint boat_components_detail_len check (char_length(detail) <= 160)
);

-- The two components the prototype's boat page showed as confirmed.
insert into public.boat_components (name, detail, status, position) values
  ('Motor', 'Gifted by SDU', 'confirmed', 1),
  ('Power converters', 'Danfoss', 'confirmed', 2);

-- Tools members own or can share.
create table public.tools (
  id uuid primary key default gen_random_uuid(),
  item text not null,
  owner_id uuid not null references public.profiles (id),
  status public.tool_status not null default 'workshop',
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tools_item_len check (char_length(btrim(item)) between 1 and 120)
);
create index tools_owner_idx on public.tools (owner_id);
create index tools_created_by_idx on public.tools (created_by);

-- Namebook: outside people the team has talked to, and who knows them.
create table public.namebook (
  id uuid primary key default gen_random_uuid(),
  person text not null,
  context text not null,
  contact text not null default '',
  known_by uuid not null references public.profiles (id),
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint namebook_person_len check (char_length(btrim(person)) between 1 and 120),
  constraint namebook_context_len check (char_length(btrim(context)) between 1 and 300),
  constraint namebook_contact_len check (char_length(contact) <= 200)
);
create index namebook_known_by_idx on public.namebook (known_by);
create index namebook_created_by_idx on public.namebook (created_by);

-- Notifications can now point at a meeting request or an assembly too.
alter table public.notifications
  add column meeting_id uuid references public.meeting_requests (id) on delete cascade,
  add column assembly_id uuid references public.assemblies (id) on delete cascade;
alter table public.notifications drop constraint notifications_has_target;
alter table public.notifications add constraint notifications_has_target check (
  task_id is not null or part_id is not null or meeting_id is not null or assembly_id is not null
);
create index notifications_meeting_idx on public.notifications (meeting_id) where meeting_id is not null;
create index notifications_assembly_idx on public.notifications (assembly_id) where assembly_id is not null;
