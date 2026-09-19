# Project Status

_Last updated: after a full independent technical audit (see `AUDIT_REPORT.md`) that found and fixed 3 real bugs._

## Completed

- Full project scaffold: Vite + React 19 + React Router 7, plain CSS, no unnecessary dependencies.
- Database schema, constraints, triggers, and RLS policies (`supabase/migrations/001_initial_schema.sql`).
- Optional demo seed data (`supabase/seed.sql`), clearly separated from application logic.
- Supabase client wiring (`src/lib/supabaseClient.js`) reading from environment variables; no service_role key anywhere in the frontend.
- Authentication: sign up, log in, log out, session persistence, role-aware `AuthContext`.
- Route protection: `ProtectedRoute` (requires session) and `AdminRoute` (requires admin role), backed by RLS as the real security boundary.
- All 14 routes from the plan implemented: `/`, `/events`, `/events/:id`, `/login`, `/register`, `/dashboard`, `/my-registrations`, `/profile`, `/admin`, `/admin/events`, `/admin/events/new`, `/admin/events/:id/edit`, `/admin/events/:id/registrations`, plus a 404 page.
- User features: browse/search/filter events, view event details, register/cancel registration, view own registrations, personal dashboard, profile editing.
- Admin features: dashboard statistics, full event CRUD with confirmation on delete, per-event registrant list with status management.
- Reusable component library: `Navbar`, `Footer`, `EventCard`, `EventForm`, `RegistrationButton`, `Modal`, `LoadingState`, `EmptyState`, `ErrorState`, `StatCard`, `ProtectedRoute`, `AdminRoute`.
- Responsive layout with no horizontal overflow, verified at 1280px and 375px widths.
- Documentation set in `docs/` (introduction through conclusion) with Mermaid diagrams for use cases, context, DFD levels 1–2, and the ER diagram.
- Landing page (`src/pages/Landing.jsx`/`Landing.css`): hero, a live "Upcoming Events" section reading real events from Supabase (public data only — no registrations/profiles access), a "How It Works" explainer, a feature overview, an administrator section with an auth-aware call-to-action, and a closing call-to-action. Fully responsive, verified at 320–1440px.

## Tested

- ✅ Production build (`vite build`) succeeds with no errors.
- ✅ Linting (`oxlint`) passes with 0 errors (1 informational Fast-Refresh warning, not a defect).
- ✅ UI rendering and layout verified with a headless browser (Playwright) across desktop and mobile viewports: no horizontal overflow, mobile nav menu toggle works.
- ✅ Full live data-flow testing against a real Supabase project: authentication (login, invalid credentials, session persistence, logout), route protection (both UI redirects and direct-API RLS enforcement), browsing/search/filtering, the full registration lifecycle (register, duplicate prevention, cancel, re-register/reactivation, cancelled-event blocking), the user dashboard and My Registrations page, profile updates, and the full admin lifecycle (dashboard statistics, create/edit/delete event with confirmation, form validation, viewing and managing registrants).
- ✅ Direct API security tests (bypassing the UI entirely) confirming RLS actually blocks: a non-admin inserting/updating/deleting events, a user registering on another user's behalf, a user reading another user's registrations or profile, and a user self-promoting to admin.
- ✅ Independent technical audit (`AUDIT_REPORT.md`): re-verified every claim above from scratch (not by re-reading this file), found and fixed 3 additional real bugs — a stale-closure bug hiding the "You're registered" badge after a page refresh, a misleading message on signing up with an already-registered email, and a hidden horizontal-overflow bug (long unbroken text silently clipped off-screen). All three were retested live after fixing, with a full cross-role smoke test showing 0 console errors afterward.
- See `docs/11-testing.md` for the original test table, and `AUDIT_REPORT.md` for the full audit with every test's method/expected/actual result, including the one real bug the *original* testing pass caught and fixed (a role-escalation-prevention trigger that also blocked legitimate admin promotion via the SQL Editor).

## Not implemented (out of scope by design)

- Email/SMS notifications, password-reset email flow.
- Payments, ticketing, QR check-in.
- Self-serve admin sign-up (promotion to admin is a manual SQL step, documented in `README.md`).
- Waitlists for full events.
- Automated (unit/integration/e2e) test suite — testing was manual, matching the project's scope.
- Chat, recommendations, analytics beyond basic counts, maps integration.

## Known limitations

- The event `category` field is free text (admin-entered), not a managed lookup table — simplest option for this scope, but allows inconsistent spelling across events.
- No pagination on the events list or admin tables — acceptable for the expected data volume of a single university's events, would need addressing at larger scale.
- Registrant emails are duplicated into `profiles.email` at sign-up (see `docs/09-database.md`) rather than read live from `auth.users`; if a user changes their email through Supabase Auth directly, `profiles.email` would need a corresponding update mechanism (not built, since email changes are out of scope).
- No dedicated "forgot password" UI, though Supabase Auth supports it — wiring a custom flow was judged out of scope for this project's size.
- Admin tables (Manage Events, Event Registrations) are not fully responsive below ~1024px: functional via horizontal scroll within the table, but with no visible scroll affordance, found during the audit and not yet fixed (design change, not a one-line bug — see `AUDIT_REPORT.md` §8/§16).
- Event status (`upcoming`/`ongoing`/`completed`) does not change automatically based on date/time — an admin must manually edit an event's status as it passes. Deliberate scope decision (no scheduled jobs), but worth knowing.

## Next recommended steps

1. Deploy (e.g. Vercel/Netlify) with the real environment variables set, and confirm the Supabase project's RLS still behaves correctly from a different origin.
2. If continuing past submission: address the admin-table responsive rough edge and the other next-phase items listed in `AUDIT_REPORT.md` §16.

---

## Landing Page

The landing page (`src/pages/Landing.jsx`, `src/pages/Landing.css`) has been implemented and polished. `LANDING_PAGE_HANDOFF.md` (project root) is kept as the original design-system reference it was built from — routes, reusable components, CSS tokens, `AuthContext` values, and what Supabase data is safe to query from a public page. It remains a useful reference for anyone editing the landing page further, even though the handoff itself has been completed.
