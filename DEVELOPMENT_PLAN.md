# Development Plan — Event Management & Registration System

## Architecture

Frontend-only single-page application backed entirely by Supabase (PostgreSQL + Auth + Row Level Security). No custom backend server.

- **Build tool:** Vite
- **Language:** JavaScript (JSX)
- **UI:** React 18 + React Router v6
- **Styling:** Plain CSS (CSS variables + per-feature stylesheets), no UI framework
- **Backend-as-a-service:** Supabase
  - Supabase Auth (email/password) for authentication
  - Supabase PostgreSQL for data storage
  - Supabase Row Level Security (RLS) for authorization — enforced at the database level, not just hidden UI
- **State management:** React Context (`AuthContext`) + local component state. No Redux — not needed for this scope.

The browser talks directly to Supabase using the public **anon** key over HTTPS. The anon key is safe to expose because all access control is enforced by RLS policies on the database, not by the key itself. The **service_role** key is never used in the frontend.

## Pages / Routes

| Route | Page | Access |
|---|---|---|
| `/` | Landing page | Public |
| `/events` | Browse Events (search + filters) | Public |
| `/events/:id` | Event Details + Register/Cancel | Public (register requires login) |
| `/login` | Login | Public |
| `/register` | Sign up | Public |
| `/dashboard` | User Dashboard | User (logged in) |
| `/my-registrations` | My Registrations | User (logged in) |
| `/profile` | Profile | User (logged in) |
| `/admin` | Admin Dashboard (stats) | Admin only |
| `/admin/events` | Manage Events (list) | Admin only |
| `/admin/events/new` | Create Event | Admin only |
| `/admin/events/:id/edit` | Edit Event | Admin only |
| `/admin/events/:id/registrations` | Event Registrations | Admin only |
| `*` | 404 Not Found | Public |

Route protection uses `<ProtectedRoute>` (requires session) and `<AdminRoute>` (requires session + `profiles.role === 'admin'`), both backed by RLS so direct API access is also blocked.

## Main Components

- `Navbar`, `Footer` — layout shell
- `EventCard` — summary card used in Browse Events, Dashboard
- `EventForm` — shared create/edit form for admin
- `Modal` — confirmation dialogs (e.g. delete event, cancel registration)
- `LoadingState`, `EmptyState`, `ErrorState` — consistent feedback UI
- `ProtectedRoute`, `AdminRoute` — route guards
- `RegistrationButton` — register/cancel action with capacity/duplicate/cancelled-event checks
- `StatCard` — small stat tile for dashboards

## Database Entities

- **profiles** — one row per `auth.users` id; `full_name`, `role` (`user` | `admin`)
- **events** — title, description, date, start_time, end_time, location, category, capacity, image_url, status, created_by, timestamps
- **registrations** — event_id, user_id, status (`registered` | `cancelled`), registered_at; unique constraint on (event_id, user_id) to prevent duplicates

## Authentication Model

- Supabase Auth email/password (`supabase.auth.signUp`, `signInWithPassword`, `signOut`)
- On sign-up, a `profiles` row is created via a Postgres trigger on `auth.users` insert, defaulting `role = 'user'`
- Session persisted by Supabase client (localStorage) and restored on load via `AuthContext`
- Admin accounts are created the same way, then promoted to `role = 'admin'` manually via SQL/Supabase dashboard (no self-serve admin signup — this is intentional and documented)

## Authorization Model / RLS Strategy

Enforced in Postgres via RLS policies, not just in the UI:

- **profiles**: user can SELECT/UPDATE only their own row (`id = auth.uid()`); no one can change their own `role` from the client (role changes only via dashboard/service key); admins can SELECT all profiles (needed for admin user list / registrant names).
- **events**: anyone (including anonymous) can SELECT. Only users with `role = 'admin'` in `profiles` can INSERT/UPDATE/DELETE.
- **registrations**: user can INSERT a row only where `user_id = auth.uid()`; user can SELECT/UPDATE (cancel) only their own rows; admins can SELECT all registrations and UPDATE status for management; capacity and duplicate checks are enforced both client-side (for UX) and via DB constraint/trigger (for integrity).

## Main User Flows

1. **Sign up → auto profile creation → browse events → view details → register → see registration reflected in "My Registrations" and Dashboard.**
2. **Login → session persists across refresh → protected pages accessible → logout clears session.**
3. **Admin login → Admin Dashboard stats → create event → edit event → view registrants for an event → cancel event (soft status change).**
4. **Non-admin manually navigates to `/admin` → redirected/blocked, and any direct Supabase call to mutate events is rejected by RLS.**

## Out of Scope (intentional)

- Payments, ticketing marketplace, QR check-in
- Email/SMS notifications
- AI features, recommendations
- Maps/geolocation APIs
- Chat/messaging
- Complex analytics, Docker, microservices, custom Node/Express backend
- Password reset via email flow (Supabase supports it, but wiring a custom email template is out of scope; default Supabase behavior is left as-is and not built as a feature)
- Full user management CRUD for admins (only what's needed: viewing registrants; role changes are a manual DB operation, documented)

## Landing Page

`src/pages/Landing.jsx` and `src/pages/Landing.css` were initially a minimal placeholder and have since been fully implemented (Hero, a live "Upcoming Events" section reading real data from Supabase, How It Works, feature overview, an administrator section, and a closing call-to-action — see `LANDING_PAGE_HANDOFF.md` for the original handoff and `AUDIT_REPORT.md`/`FINAL_ACADEMIC_AUDIT.md` for what was verified). The rest of the app (routes, auth, data) never depended on its content, by design.
