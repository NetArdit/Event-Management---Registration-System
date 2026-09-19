# Campus Events — Event Management & Registration System

A university faculty project: a web application for browsing, creating, and registering for campus events. React + Vite frontend, Supabase (PostgreSQL, Auth, Row Level Security) backend — no custom server.

See [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md) for the architecture and scope, [`docs/`](docs/) for full documentation and diagrams, and [`PROJECT_STATUS.md`](PROJECT_STATUS.md) for what's implemented, tested, and known limitations. [`AUDIT_REPORT.md`](AUDIT_REPORT.md) and [`FINAL_ACADEMIC_AUDIT.md`](FINAL_ACADEMIC_AUDIT.md) record the independent technical and academic-readiness audits performed on this project, including real bugs found and fixed.

## Tech stack

React 19 · Vite · React Router 7 · Supabase (Auth + PostgreSQL + RLS) · plain CSS.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run the contents of [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql).
3. *(Optional)* Also run [`supabase/seed.sql`](supabase/seed.sql) for sample demo events.
4. Go to **Authentication → Providers → Email** and turn **"Confirm email" OFF**. This project has no email-sending infrastructure (by design, see `DEVELOPMENT_PLAN.md`), so with confirmation left on, a new sign-up would be stuck waiting for a confirmation email that the app never sends a custom flow for. With it off, `signUp` returns a usable session immediately. (Leave "Enable Email provider" itself turned on.)
5. In **Settings → API**, copy the **Project URL** and the **anon public** key.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your Project URL and anon key.

### 4. Run the dev server

```bash
npm run dev
```

> **Windows note:** if your project folder path contains an `&` character, `npm run <script>` may fail with a `MODULE_NOT_FOUND`/"not recognized" error due to a known issue with npm's `.cmd` shims on Windows. Workaround: run the tool directly with Node, e.g. `node "node_modules/vite/bin/vite.js"` instead of `npm run dev`. The simplest fix is to rename the folder to remove the `&`.

### 5. Create an admin account

Sign up normally through the app (`/register`), then promote that account to admin from the Supabase SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'your-email@example.com';
```

## Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run oxlint |

## Landing page

`src/pages/Landing.jsx` and `src/pages/Landing.css` are fully implemented — a hero, a live "Upcoming Events" section reading real events from Supabase, a "How It Works" explainer, a feature overview, an administrator section, and a closing call-to-action. See [`LANDING_PAGE_HANDOFF.md`](LANDING_PAGE_HANDOFF.md) for the design-system reference it was built from.
