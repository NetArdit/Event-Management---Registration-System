# Implementation

## Project structure

```
src/
  main.jsx              Entry point: mounts <App> inside BrowserRouter + AuthProvider
  App.jsx                Route table (Navbar + Footer shell wrapping all pages)
  index.css              Global styles: CSS variables, resets, shared button/form/badge classes
  lib/
    supabaseClient.js     Single Supabase client instance, reads env vars
  context/
    AuthContext.jsx       Session/profile state, sign up/in/out, exposes useAuth()
  components/             Reusable, presentation-focused pieces (see below)
  pages/                  One file per route
    admin/                Admin-only pages
  utils/
    formatters.js          Date/time display helpers
    eventHelpers.js        Status labels, capacity/registration helper functions
supabase/
  migrations/001_initial_schema.sql   Full schema, constraints, triggers, RLS
  seed.sql                             Optional demo data (not application logic)
docs/                    This documentation set
```

## Routing

`App.jsx` defines every route with React Router's `<Routes>`/`<Route>`. Two guard components wrap protected pages:

- **`ProtectedRoute`** — redirects to `/login` (preserving the intended destination) if there is no authenticated session.
- **`AdminRoute`** — redirects to `/login` if unauthenticated, or to `/dashboard` if authenticated but not an admin.

Both guards read from `AuthContext` and show a `LoadingState` while the session is still being restored, so a logged-in admin refreshing `/admin` never gets bounced before their role has loaded.

**Important:** these guards only control what renders in the browser. The actual security boundary is the database's RLS policies (see [`09-database.md`](09-database.md)) — a non-admin who somehow reached an admin page, or called the API directly, still cannot read or write data they're not authorized for.

## Authentication

`AuthContext` (`src/context/AuthContext.jsx`) is a single React Context that:

1. On mount, calls `supabase.auth.getSession()` to restore any existing session from local storage, then loads the matching `profiles` row (which contains the `role`).
2. Subscribes to `supabase.auth.onAuthStateChange` so login/logout in one tab (or a token refresh) updates state everywhere in the app.
3. Exposes `signUp`, `signIn`, `signOut`, the current `user`, `profile`, a convenience `isAdmin` boolean, and `loading`.

Session persistence, token refresh, and password hashing are all handled by Supabase Auth — no custom code was written for those.

## Supabase integration

`src/lib/supabaseClient.js` creates one `supabase-js` client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (read from `.env.local`, never committed). Every page that needs data calls this client directly with the standard `supabase.from('table').select/insert/update/delete()` API — there is no custom data-access layer, since Supabase's auto-generated REST API already is one, and RLS is what makes calling it directly from the browser safe.

## Database & RLS

Covered in full in [`09-database.md`](09-database.md). In short: three tables (`profiles`, `events`, `registrations`), enforced by RLS policies plus two triggers (`prevent_role_escalation`, `enforce_registration_rules`) that provide defense-in-depth beyond what row-level policies alone can express.

## Reusable components

| Component | Purpose |
|---|---|
| `Navbar`, `Footer` | Page shell, shown on every route. Navbar adapts its links to auth state and role, and collapses into a toggled menu on narrow viewports. |
| `EventCard` | Summary card (title, date, location, category, capacity, status) used on Browse Events, Dashboard. |
| `EventForm` | Shared create/edit form for admin event management, with client-side validation. |
| `RegistrationButton` | Encapsulates all registration button states: log in prompt, register, cancel, full, cancelled event, ended event. |
| `Modal` | Generic confirmation dialog (used for cancelling a registration, deleting an event). |
| `LoadingState`, `EmptyState`, `ErrorState` | Consistent feedback for the three non-happy-path states every data-driven page can be in. |
| `StatCard` | Small statistic tile used on both dashboards. |
| `ProtectedRoute`, `AdminRoute` | Route guards described above. |

## Pages

Each route in [`DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md) corresponds to one file in `src/pages/` (or `src/pages/admin/`). Data fetching happens in the page component with a local `useState`/`useEffect` pattern — no data-fetching library was introduced, since the app's scope doesn't need caching, pagination, or optimistic updates beyond what a direct Supabase call and a manual refetch already provide.

## Styling

Plain CSS with variables defined once in `src/index.css` (`--color-primary`, spacing scale, etc.) and shared utility classes (`.btn`, `.card`, `.badge`, `.form-group`, `.events-grid`, `.dashboard-stats`) reused across pages, plus a small page- or component-scoped stylesheet for anything specific to it. No CSS framework or CSS-in-JS library was used, keeping the styling approach easy to read and modify directly.
