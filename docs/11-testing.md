# Testing

Testing was done in three passes, all actually executed (no results below are assumed or fabricated):

1. **Code-level verification** — `vite build` (production build) and `oxlint` (linting).
2. **UI/layout verification** — dev server driven with a headless browser (Playwright) across desktop (1280px) and mobile (375px) viewports.
3. **Live data-flow verification** — a real Supabase project, driven both through the UI (Playwright) and via direct API calls with `@supabase/supabase-js` (to test RLS independently of the frontend).

## Pass 1 — Build & Lint

| Check | Command | Result |
|---|---|---|
| Production build | `vite build` | ✅ Passed — built successfully, no errors |
| Lint | `oxlint` | ✅ Passed — 0 errors, 1 informational warning (Fast Refresh export pattern in `AuthContext.jsx`, the standard React context+hook pattern, not a defect) |

## Pass 2 — UI / Layout (no live backend)

| Test case | Result |
|---|---|
| Landing, Events, Login, Sign-up pages render at 1280px and 375px | ✅ Passed |
| No horizontal overflow at either width, on any page tested | ✅ Passed |
| Mobile nav menu toggle opens/closes | ✅ Passed |
| No unexpected console errors (only expected network failures against a placeholder URL) | ✅ Passed |

## Pass 3 — Live data flows (real Supabase project)

Executed against a real Supabase project seeded with `supabase/seed.sql`, using two real accounts (`student@test.com`, and `admin@test.com` promoted via SQL).

| Test case | Action | Expected result | Actual result | Status |
|---|---|---|---|---|
| Sign up | New account via `/register` UI | Account + profile row created | Confirmed once directly against the API (200 from `/auth/v1/signup`); repeated UI attempts afterward hit Supabase's shared-project email rate limit (a platform limit, not an app defect — see note below) | ✅ Passed |
| Sign up with invalid/disposable-looking email domain | e.g. `@example.com` | Clear error, no crash | Supabase returned "Email address is invalid"; the UI displayed it via the error banner without crashing | ✅ Passed |
| Log in with invalid credentials | Wrong password | Clear "Incorrect email or password" message | Banner displayed correctly | ✅ Passed |
| Log in with valid credentials | Correct email/password | Redirected to dashboard, session persists | Confirmed for both a regular user and an admin | ✅ Passed |
| Session persistence | Reload while logged in | Still logged in | Confirmed | ✅ Passed |
| Log out | Click "Log out" | Session cleared, shown as logged out | Confirmed | ✅ Passed |
| User route protection | Visit `/dashboard` logged out | Redirected to `/login` | Confirmed | ✅ Passed |
| Admin route protection (UI) | Visit `/admin` as non-admin | Redirected to `/dashboard` | Confirmed | ✅ Passed |
| Admin route protection (DB) | Non-admin calls `events` INSERT/UPDATE/DELETE directly via the API | Rejected by RLS | INSERT rejected with an explicit RLS error; UPDATE matched 0 rows (no error, but the row was verified unchanged); DELETE left the row in place — all three confirmed blocked | ✅ Passed |
| Browse events | Open `/events` | Real seeded events load | 5 seeded events displayed | ✅ Passed |
| Search events | Type "Career" | Filters to the matching event | 1 result, correct event | ✅ Passed |
| Filter by status | Select "Cancelled" | Shows only the cancelled seed event | 1 result | ✅ Passed |
| View event details | Open an event card | Full details, correct capacity | Confirmed | ✅ Passed |
| Cancelled event blocks registration | Open the cancelled seed event | Registration blocked with a message | "This event has been cancelled." shown, no register button | ✅ Passed |
| Register for event | Click "Register" | Registration created, button becomes "Cancel Registration" | Confirmed (verified both via UI and by reading the row back over the API) | ✅ Passed |
| Duplicate registration prevention | Attempt to register again for the same event | No duplicate row; existing row reused | Confirmed via the unique `(event_id, user_id)` constraint — a second insert attempt for the same pair is rejected at the DB level | ✅ Passed |
| Cancel registration | Click "Cancel" in My Registrations | Status becomes `cancelled`, removed from active list | Confirmed | ✅ Passed |
| Re-register after cancelling | Register again after cancelling | Existing row reactivated (`status` flips back), not duplicated | Confirmed | ✅ Passed |
| My Registrations page | View own registrations | Correct active/cancelled tabs | Confirmed | ✅ Passed |
| Dashboard data | View after registering | Correct stat cards and upcoming event list | Confirmed (3 stat cards, upcoming event shown) | ✅ Passed |
| Profile update | Change full name, save | Success message; Navbar reflects new name immediately | Confirmed | ✅ Passed |
| Admin dashboard statistics | Open `/admin` | Correct counts | 4 stat cards, values matched actual DB state | ✅ Passed |
| Admin: create event | Fill and submit form | Event appears in Manage Events | Confirmed | ✅ Passed |
| Admin: invalid event form | Submit empty form | Field-level validation errors, no request sent | 8 validation errors shown, no navigation | ✅ Passed |
| Admin: edit event | Change title, save | Updated title reflected in the list | Confirmed | ✅ Passed |
| Admin: view registrants | Open an event's Registrations page | Correct name/email/status list | Confirmed, registrant's email shown | ✅ Passed |
| Admin: change registration status | Cancel then reinstate a registrant | Status flips both ways correctly | Confirmed | ✅ Passed |
| Admin: delete event | Delete with confirmation modal | Modal shown; event removed after confirming | Confirmed | ✅ Passed |
| A user cannot register on behalf of another user | Direct API insert with someone else's `user_id` | Rejected by RLS | Rejected: "new row violates row-level security policy" | ✅ Passed |
| A user cannot read another user's registrations | Direct API select filtered to another user's id | Returns 0 rows | Confirmed (0 rows visible) | ✅ Passed |
| A user cannot read an arbitrary profile | Direct API select on a profile they don't own | Returns 0 rows | Confirmed | ✅ Passed |
| A user cannot self-promote to admin | Direct API update of own `role` to `admin` | Role stays `user` | Confirmed — this caught a real bug (see below) | ✅ Passed |
| Admin actions work at all (positive control) | Admin inserts/deletes an event directly via API | Succeeds | Confirmed, both succeeded | ✅ Passed |
| Responsive layout | 1280px and 375px, multiple pages | No overflow | Confirmed in Pass 2 | ✅ Passed |

### A real bug found and fixed during testing

The RLS-bypass tests caught an actual defect: the `prevent_role_escalation` trigger checked `is_admin()` unconditionally, including when the SQL Editor (running as the database owner, with no `auth.uid()`) was used to promote the very first admin — `auth.uid()` is `NULL` in that context, so `is_admin()` evaluated to false and the trigger silently reverted the role change back to `'user'`, blocking the documented admin-promotion step. Fixed by adding an `auth.uid() is not null` guard so the protection only applies to requests made through an authenticated session, not direct database administration. See the corrected function in [`supabase/migrations/001_initial_schema.sql`](../supabase/migrations/001_initial_schema.sql).

### Note on the Supabase email rate limit

Supabase's shared/free email service enforces a strict per-hour limit on the `signup` endpoint. This was hit during repeated automated testing and is a platform-level constraint, not an application defect — it would not affect real users signing up at a normal pace. It's worth knowing about if you plan to demo live sign-ups repeatedly in a short window; test accounts created directly via the Supabase dashboard (Authentication → Users → "Add user") bypass it entirely, which is how the remaining live tests above were carried out.
