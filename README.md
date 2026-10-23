# SDU Krakens Task Hub

Task organizer for SDU Krakens (Monaco Energy Boat Challenge 2027): who does which part of the boat, what is blocked, what is waiting for review, and a contribution record built from finished work.

**Stack:** SvelteKit 3 (Svelte 5, TypeScript) for backend and frontend, Supabase (Postgres, Auth) for data, Vercel for hosting. Free tiers only, and the hub never sends email.

## What it does

| Page | For |
|---|---|
| **My tasks** | Everything assigned to you, grouped by overdue, due this week and later. Tasks waiting for your review. |
| **Board** | A column per status for a department (or everyone). Add and move tasks. |
| **Parts** | A part of the boat with a lead, a team of at most two, a deadline and its 12 standard workflow steps as real, assignable tasks. |
| **Contribution log** | Built from the tasks people pick up. Finishing a task with an outcome note writes the entry, so nothing is typed twice. |
| **Boat tracker** | What is confirmed on the boat. Admins add components and mark them confirmed. |
| **Tool list** | Tools members own or can share, and where they are. You manage your own; admins any. |
| **Announcements** | Admin posts to the whole team, with countdowns to the next event and Monaco. |
| **Idea bank** | Anyone posts an idea for a department or the whole team; everyone upvotes. |
| **Polls** | Admins create polls; one vote per member, changeable while the poll is open. |
| **Events** | The team calendar of shows, deadlines and the race. Admins add events. |
| **General assembly** | An admin proposes one; it is planned once every department head (active admin) approves. Admins add the summary. |
| **Department chat** | A chat per department. Admins can read and write in every department. |
| **Request meeting** | Ask your department for a meeting; everyone in it is notified, and you get WhatsApp and email texts to paste. |
| **Handbook** | Roles and the semester lifecycle, hiring with open positions, a personal onboarding checklist, workshop rules, which channel to use for what. |
| **Namebook** | Outside people the team knows, and who knows them. |
| **Members** | The directory. Admins add members, reset passwords, deactivate and promote. Members fill in studies, semester and preferred DM channel in My profile. |
| **Notifications** | Assigned to you, review requested, blocked, added to a part, meeting requested, assembly needs your approval. In-app only. |

Statuses: `todo → doing → blocked → review → done / failed`. A blocked task needs a reason. When a task has a reviewer, only the reviewer, the part lead or an admin can mark it done.

## Run it locally

You need Node 22.17+, Docker and a free ports range (the local stack uses 553xx, see `supabase/config.toml`).

```bash
npm install                 # if npm 10.9 crashes ("edgesOut"), use: npx npm@11 install
npm run db:start            # local Postgres + Auth + API; applies supabase/migrations
```

Copy the URL and keys that `npx supabase status -o env` prints into `.env.local` (see `.env.example`; git ignores it), then:

```bash
npm run dev
npm run member -- --username ada --name "Ada Admin" --dept electrical --admin
```

The last command prints a temporary password once. Log in, you are asked to choose your own.

## Checks

```bash
npm run check     # types, incl. the typed Supabase queries
npm run lint      # note: also scans prototype/ (the old v1), which is not lint-clean
npm test          # unit tests
npm run db:test   # database tests: RLS, triggers, the create_part function (needs db:start)
```

## Accounts without email

Members sign in with a **username** and password. Supabase Auth needs an email address, so the username is mapped to `username@krakens.invalid` (a reserved domain that cannot receive mail; see `src/lib/config.ts`). Nothing is ever sent.

- Only admins create accounts: **Members → Add a member**, or `npm run member`. Public sign-up is off, and the database also refuses any user created without an admin's metadata.
- The temporary password is shown once, never stored, and you hand it over yourself. The member must change it at first login.
- There is no "forgot password": an admin resets it from **Members → Manage**. Admins never see a member's own password.
- Deactivating a member blocks login at once and keeps their history.

## How access is enforced

Row Level Security in Postgres is the real gate; the SvelteKit server only validates input.

- Everyone signed in and active can read the organizer. Anonymous visitors can read nothing.
- Members change only the tasks they are assigned to, review, created, or that belong to a part they lead or work on. Admins (department heads) can do everything.
- `profiles.is_admin`, `dept` and `username` cannot be edited by a member, even with the public key.
- The service key (`SUPABASE_SECRET_KEY`) is only used on the server for member management, after re-checking the caller is an admin.
- Every function must revoke `EXECUTE` from `PUBLIC` (Postgres grants it by default and `anon` inherits it). A database test fails if one leaks.

## Database workflow

Schema changes go through `supabase/migrations/` only, never the dashboard. Add a migration, then `npm run db:test`.

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push          # needs a network that allows Postgres (ports 5432/6543)
npm run db:types              # regenerate src/lib/database.types.ts after schema changes
```

## Deploy to Vercel

`@sveltejs/adapter-vercel` is already configured. Set these in the Vercel project (Production and Preview):

| Variable | Notes |
|---|---|
| `PUBLIC_SUPABASE_URL` | Project URL |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Safe in the browser; RLS protects the data |
| `SUPABASE_SECRET_KEY` | Server only. Never prefix with `PUBLIC_`. |

Free-tier caveats:

- **Vercel Hobby cannot deploy a private repo owned by a GitHub organization.** Options: Vercel Pro, a public repo (scrub history first), a repo under a personal account, or `vercel deploy` from GitHub Actions.
- **Supabase Free pauses a project after 7 days without activity and has no automatic backups.** Plan a keep-alive ping and a scheduled `pg_dump`.
- In Supabase **Authentication → Sign In / Providers**, keep "Allow new users to sign up" off, and set the minimum password length to 8.

## Layout

```
src/hooks.server.ts            per-request Supabase client, verified claims
src/env.ts                     environment variable declarations (SvelteKit 3)
src/routes/(auth)/login        login
src/routes/set-password        forced first-login password change
src/routes/(app)/…             the pages above, behind the login guard
src/lib/server/tasks.ts        form actions shared by every page that shows tasks
src/lib/server/admin.ts        service-role helpers (members)
src/lib/server/hub.ts          form parsing helpers for the hub pages
src/lib/hub.ts                 labels and fixed handbook content for the hub pages
supabase/migrations            organizer and hub: schema, security (RLS, grants), logic (triggers, create_part, create_poll)
supabase/tests/database        pgTAP tests
scripts/create-member.mjs      create an account without email
prototype/                     the old v1 front-end prototype; delete once nothing is missed
```
