# Technical Audit Report

**Scope:** Independent verification of the Event Management & Registration System against its own source code, live database, and prior delivery report. No new features were added. Three real bugs were found and fixed (with retest); all other findings are reported without modifying the application, per the audit brief.

**Method:** Static code review (`Read`/`Grep` across `src/` and `supabase/`), live testing against the project's real Supabase instance (not a mock) using both the UI (Playwright, headless Chromium) and direct API calls with `@supabase/supabase-js` that bypass the UI entirely, and empirical database introspection (testing constraints by trying to violate them, not just reading the SQL).

---

## 1. Executive Summary

The application is fundamentally sound. Authorization is correctly enforced at the database layer (verified by direct API attacks, not just UI inspection), the core registration business rules (duplicates, capacity, cancelled events) hold under direct database manipulation, and the build/lint pipeline is clean.

This audit found and fixed **3 real bugs**, none of which were security issues:

1. A stale-closure bug in `Events.jsx` that made the "You're registered" badge never appear on Browse Events after a page refresh while logged in.
2. A misleading message on sign-up with an already-registered email, caused by Supabase's anti-enumeration behavior when email confirmation is disabled.
3. A hidden horizontal-overflow bug where long unbroken text (e.g. a pasted URL in an event description) would silently overflow its container off-screen, invisible to the user because a global `overflow-x: hidden` masked the scrollbar that would normally reveal it.

No security defects were found. Two documentation drifts were corrected. Several non-bug findings (an admin-table responsive rough edge, some duplicated logic, no automatic event-status transitions) are reported below without being fixed, since they are UX/design items, not defects, and the audit brief asked for findings first rather than a redesign.

---

## 2. Architecture Audit

**Method:** Read every file in `src/`, grepped for `console.log`/`TODO`/hardcoded data/unused imports, ran `oxlint` with extra rule categories enabled beyond the project's own config to hunt for anything the default config might hide.

| Check | Result |
|---|---|
| React app structure (pages/components/context/lib/utils separation) | Clean; consistent with `DEVELOPMENT_PLAN.md` |
| React Router configuration | All 13 routes + 404 wired correctly in `App.jsx`; guards applied consistently |
| `AuthContext` | Correct session-restore + listener pattern; one bug found in a *consumer* of it (`Events.jsx`, see §6) |
| `ProtectedRoute` / `AdminRoute` | Correctly gate on `loading` before checking `user`/`isAdmin` — verified `loading` only clears after both session *and* profile are loaded, so no race on first paint |
| Supabase client (`lib/supabaseClient.js`) | Reads only `import.meta.env.VITE_SUPABASE_*`; throws loudly if missing; no fallback/hardcoded values |
| Reusable components | `EventCard`, `EventForm`, `RegistrationButton`, `Modal`, `LoadingState`/`EmptyState`/`ErrorState`, `StatCard` all used consistently, no copy-pasted variants |
| `console.log`/debug code | None found. Only two `console.error` calls (`AuthContext.jsx`), both legitimate error logging, not debug leftovers |
| Hardcoded fake data | None found (`grep` for mock/sample/dummy arrays returned nothing) |
| Unused imports | None found (verified programmatically per-file, not just by memory) |
| Dead code | None found |
| Broken imports | None — confirmed by a clean production build |
| Incorrect async handling / race conditions | **1 real bug found**, see §6 (`Events.jsx`) |
| Error handling | Every data-fetching page has a try/catch and an `ErrorState` with retry |
| Loading / empty states | Present on every data-driven page (confirmed by reading each page file) |

**Findings not rising to "bug" status (reported, not fixed):**

- **Duplicated logic:** the pattern `rows.filter(r => r.status === 'registered').length` (or an equivalent counts-map `forEach`) is independently reimplemented in `Events.jsx`, `Dashboard.jsx`, `EventDetails.jsx`, and `AdminEventRegistrations.jsx`. Works correctly everywhere it's used, but a shared helper in `utils/eventHelpers.js` would reduce duplication. Recommended for a future refactor pass, not fixed now (would touch 4 files for a non-defect).
- **`AuthContext.jsx` Fast-Refresh warning:** exporting both the `AuthProvider` component and the `useAuth` hook from one file triggers an oxlint informational warning. This is the standard, idiomatic React context+hook pattern — not a defect, and splitting it into two files would be an unnecessary abstraction for this project's size.
- **`Modal.jsx`** re-subscribes its `keydown` listener on every parent re-render, because callers pass an inline arrow function as `onClose` (a new reference each render). Functionally correct — exactly one listener is ever active — just slightly more churn than a `useCallback`'d handler would cause. Not worth the added complexity here.

---

## 3. Authentication Audit

**Method:** Live tests against the real Supabase project (not simulated), via both the UI and direct API calls.

| Test | Method | Expected | Actual | Result |
|---|---|---|---|---|
| Sign up | Fill `/register`, submit | Account created, profile row auto-created | `200` from `/auth/v1/signup`; profile row confirmed via direct query with correct `role='user'`, `email` populated | ✅ PASS |
| Log in | Valid credentials via `/login` | Redirect to `/dashboard`, session established | Confirmed for both a regular user and an admin account | ✅ PASS |
| Log out | Click "Log out" | Session cleared | Confirmed — subsequent visit to `/dashboard` redirects to `/login` | ✅ PASS |
| Session persistence | Reload while logged in | Still logged in after reload | Confirmed | ✅ PASS |
| Refresh while logged in | Hard `page.goto()` (not client nav) to an authenticated page | Session restored from storage, correct data shown | Confirmed — **and this exact scenario is what exposed the Bug #1 below** | ✅ PASS (after fix) |
| Refresh while logged out | Hard reload on `/dashboard` with no session | Redirect to `/login`, no crash | Confirmed, 0 console errors | ✅ PASS |
| Invalid credentials | Wrong password | Clear "Incorrect email or password" message | Banner shown correctly | ✅ PASS |
| Existing email | Sign up with an email that already has an account | Clear "already exists" error | **Initially FAILED** — showed "check your email" instead (Bug #2, fixed below); confirmed correct after fix | ✅ PASS (after fix) |
| Protected route, unauthenticated | Visit `/dashboard` logged out | Redirect to `/login` | Confirmed | ✅ PASS |
| Admin route, normal user | Visit `/admin` as `student@test.com` | Redirect to `/dashboard` | Confirmed | ✅ PASS |

**Auth state after refresh** is handled correctly: `AuthContext` awaits both `getSession()` and the profile fetch before clearing its `loading` flag, so `ProtectedRoute`/`AdminRoute` never render a decision on stale/incomplete data.

---

## 4. Authorization & RLS Audit

**Method:** Read every policy in `supabase/migrations/001_initial_schema.sql`, then attacked each rule directly via `@supabase/supabase-js` using real authenticated tokens for two real accounts, deliberately bypassing the UI.

| Table | Policy | Why it provides the intended protection |
|---|---|---|
| `profiles` SELECT | `auth.uid() = id OR is_admin()` | A user can only read their own row unless `is_admin()` (itself `security definer`, so it can safely check `profiles.role` without recursively re-triggering this same policy) returns true. |
| `profiles` UPDATE | `auth.uid() = id`, plus `prevent_role_escalation` trigger | RLS alone can't restrict which *column* an update touches — a user could otherwise `UPDATE profiles SET role='admin' WHERE id=auth.uid()` since that row is their own. The trigger closes this gap by resetting `role` back to `OLD.role` whenever a change is attempted by an authenticated non-admin (`auth.uid() is not null`). Direct SQL by the project owner (`auth.uid()` is null there) is intentionally exempt, which is what makes the documented admin-promotion step work at all. |
| `events` SELECT | `true` | Public event browsing is a deliberate requirement; no data here needs protecting from reads. |
| `events` INSERT/UPDATE/DELETE | `is_admin()` | Only a `profiles.role = 'admin'` user can mutate events, checked server-side — not just a hidden button. |
| `registrations` SELECT | `auth.uid() = user_id OR is_admin()` | A user can only see their own registration history; admins can see all (needed to manage events). |
| `registrations` INSERT | `auth.uid() = user_id` | A user can only create a registration **for themselves** — the `user_id` in the row must match their own token's subject claim, so they cannot register another person. |
| `registrations` UPDATE | `auth.uid() = user_id OR is_admin()` | Covers both self-service cancellation and admin-driven status changes, with the same ownership check as SELECT. |
| `registrations` — no DELETE policy | (absent) | Cancellation is modeled as a status change; hard deletion is impossible for *anyone* through the API, including admins — confirmed empirically below. |

### Direct-API attack results (bypassing the UI)

| Test | Method | Expected | Actual | Result |
|---|---|---|---|---|
| Non-admin inserts an event | `client.from('events').insert(...)` as `student@test.com` | Rejected | `new row violates row-level security policy for table "events"` | ✅ PASS |
| Non-admin updates an event | `.update({title:...}).eq('id', X)` as non-admin | 0 rows affected | Returned no error (expected PostgREST behavior for an RLS-filtered UPDATE) but **the row was independently re-read afterward and confirmed unchanged** — a naive "no error = it worked" check would have been a false positive here, which is exactly what happened on the first pass of this audit before it was corrected | ✅ PASS |
| Non-admin deletes an event | `.delete().eq('id', X)` as non-admin | Row survives | Row confirmed still present afterward | ✅ PASS |
| User registers on another user's behalf | Insert with `user_id` = someone else's id | Rejected | `new row violates row-level security policy for table "registrations"` | ✅ PASS |
| User reads another user's registrations | `.select('*').eq('user_id', otherId)` | 0 rows | 0 rows returned | ✅ PASS |
| User reads an arbitrary profile | `.select('*').eq('id', randomId)` | 0 rows | 0 rows returned | ✅ PASS |
| User sets their own role to admin | `.update({role:'admin'}).eq('id', self)` | Role stays `user` | Confirmed — role remained `user` | ✅ PASS |
| Admin performs the same actions (positive control) | Insert + delete an event as admin | Succeeds | Both succeeded | ✅ PASS |
| Anyone deletes a registration (even admin) | `.delete()` on `registrations` | 0 rows affected, always | Confirmed during this audit's own cleanup attempt — an admin's own `DELETE` matched 0 rows, because no DELETE policy exists for anyone | ✅ PASS |

**Note on a previously-fixed issue:** during the prior testing phase (before this audit), the `prevent_role_escalation` trigger was found to also block the *legitimate* admin-promotion path (running `UPDATE profiles SET role='admin'` from the SQL Editor, where `auth.uid()` is null). That was fixed at the time by adding the `auth.uid() is not null` guard shown in the table above. This audit re-verified that fix is still in place in the migration file and still behaves correctly live (confirmed `admin@test.com` has `role='admin'` and can access `/admin`).

---

## 5. Database Audit

**Method:** Did not just read the schema — attempted to violate every constraint listed in the documentation, live, and checked cascade behavior by actually deleting rows and re-querying.

| Test | Method | Expected | Actual | Result |
|---|---|---|---|---|
| Unique `(event_id, user_id)` | Insert a second registration for the same pair | `23505 duplicate key value` | Exact error returned | ✅ PASS |
| Invalid `event_id` reference | Insert a registration with a non-existent event id | Rejected | Rejected by the `enforce_registration_rules` trigger (`P0001 Event does not exist`) before it could even reach the FK check | ✅ PASS |
| `capacity > 0` check | Insert an event with `capacity: 0` | `23514 check constraint "events_capacity_check"` | Exact error returned | ✅ PASS |
| `end_time > start_time` check | Insert with `end_time` before `start_time` | `23514 check constraint "end_after_start"` | Exact error returned | ✅ PASS |
| `status` enum check | Insert an event with `status: 'not_a_real_status'` | `23514 check constraint "events_status_check"` | Exact error returned | ✅ PASS |
| Cascade delete | Create an event, register for it, delete the event | Registration row is also gone (no orphan) | Confirmed: 1 registration existed before, 0 after the event was deleted | ✅ PASS |
| `created_by` on admin deletion | (Documented as `ON DELETE SET NULL`) | Events survive if the creating admin is deleted | Verified by reading the migration's FK definition (`references public.profiles (id) on delete set null`); not re-tested live since it would require deleting a real auth user, which was judged an unnecessary destructive action for this audit | Verified by inspection |

**Design matches documentation** on every point checked, with the two clarifications made in §10 (Documentation Audit).

**No orphan records, no unsafe triggers, no incorrect cascade behavior, no inconsistent status values found.**

---

## 6. Registration Logic Audit

**Method:** Built a precise boundary-condition test using two real distinct accounts (`student@test.com`, `admin@test.com`) and a temporary `capacity: 1` event, exercising the exact lifecycle the brief asked about.

| Test | Method | Expected | Actual | Result |
|---|---|---|---|---|
| First registration fills a capacity-1 event | Student registers | Succeeds | Succeeded | ✅ PASS |
| Second registration when full | Admin registers for the same now-full event | Blocked | `Event is full` (from `enforce_registration_rules` trigger) | ✅ PASS |
| Cancel frees the spot | Student cancels | Spot becomes available | Confirmed | ✅ PASS |
| Registration succeeds once a spot frees up | Admin registers again | Succeeds | Succeeded | ✅ PASS |
| Reactivating a cancelled registration when full | Student flips their own cancelled row back to `registered` while admin now occupies the only spot | Blocked | `Event is full` — confirmed the trigger applies equally to **UPDATE**, not just INSERT, which matters because reactivation is an UPDATE | ✅ PASS |
| Registering for a cancelled event | Set event `status='cancelled'`, then attempt to reactivate a registration | Blocked | `Cannot register for a cancelled event` | ✅ PASS |
| Active vs cancelled counting | Compared `registered`-status count against total rows throughout the above | Only `status='registered'` rows count toward capacity | Confirmed at every step above | ✅ PASS |
| Admin changing registration status | Cancel/Reinstate a registrant from the admin UI | Status flips both directions, capacity count updates | Confirmed (also see §7) | ✅ PASS |
| Event deletion behavior | Delete an event with active registrations | Registrations cascade-deleted, not orphaned | Confirmed (see §5) | ✅ PASS |

**Frontend checks are backed by database-level protection, not just cosmetic:** every rule enforced by `RegistrationButton.jsx`'s conditional rendering (full/cancelled/completed) is independently re-enforced by the `enforce_registration_rules` trigger, confirmed by deliberately trying to violate each rule via direct API calls that skip the frontend's own checks entirely.

---

## 7. Admin Audit

**Method:** Full live workflow test via the UI (Playwright) plus the direct-API attack tests from §4 to confirm a non-admin can't reach any of this through the API.

| Test | Method | Expected | Actual | Result |
|---|---|---|---|---|
| Admin login | `/login` as `admin@test.com` | Redirect to dashboard | Confirmed | ✅ PASS |
| Admin dashboard stats | Load `/admin` | 4 stat cards with correct counts | Confirmed, values matched actual DB state | ✅ PASS |
| Create event | Fill and submit `/admin/events/new` | Appears in Manage Events | Confirmed | ✅ PASS |
| Invalid event form | Submit empty form | Field-level validation errors, no request sent | 8 validation errors shown, URL unchanged | ✅ PASS |
| Edit event | Change title, save | Updated title reflected in the list | Confirmed | ✅ PASS |
| View registrations | Open an event's Registrations page | Correct name/email/status per registrant | Confirmed | ✅ PASS |
| Change registration status | Cancel then reinstate a registrant | Status flips both ways, capacity count updates | Confirmed | ✅ PASS |
| Delete event | Delete with confirmation modal | Modal required; event and its registrations removed | Confirmed | ✅ PASS |
| Non-admin blocked from all of the above via direct API | See §4 | Rejected at the database, not just hidden in the UI | Confirmed for insert/update/delete on `events` and status-change on `registrations` | ✅ PASS |

---

## 8. Responsive/UI Audit

**Method:** This was **not** a simple pass/fail scroll-width check. A first automated pass checked `document.documentElement.scrollWidth` vs `clientWidth` across all 7 required breakpoints (320, 375, 390, 768, 1024, 1280, 1440) and 10 pages, plus a deliberately long/stress-test event (long title, long location, an 800-character unbroken description, a long category name) and found zero issues — **which was misleading**, because the project's own global `overflow-x: hidden` on `html, body` masks true overflow from that specific measurement. A second pass measured the actual widest DOM element on every page/breakpoint combination directly, which is what actually caught Bug #3 (see §13).

| Area | Breakpoints checked | Concrete finding |
|---|---|---|
| Navbar / mobile menu | All 7 | Toggle opens/closes correctly at ≤860px; no overflow |
| Event card grid | All 7 | Long titles/locations/category names wrap cleanly within cards; no truncation, no overflow, even with a deliberately extreme 190-character title |
| Event details page | All 7 | **Bug #3 found here** (long unbroken text overflowed invisibly) — fixed, re-verified with a full re-scan afterward showing 0 remaining instances |
| Login/Register forms | All 7 | Clean at every width tested, including 320px |
| Admin event form | All 7 | Clean at every width tested, including 320px |
| Modal (delete confirmation) | All 7 | Renders correctly even with a very long event title embedded in the confirmation text |
| **Admin tables** (Manage Events, Event Registrations) | 320, 375, 390, 768 | **Concrete issue, not fixed (see below):** the Title/Date/Category columns consume the full viewport width, pushing Capacity/Status/Actions off-screen. The table wrapper (`.admin-table-scroll`) *is* horizontally scrollable (`overflow-x: auto`), so nothing is technically broken or unreachable, but there is no visible scrollbar or affordance hinting that more content exists off to the right — a real user could easily believe the Edit/Delete/Registrations buttons are simply missing. At 1024px and above the table fits without any scrolling. |
| Dashboard / My Registrations / Profile | All 7 | Clean at every width tested |

**Why the admin-table issue was reported but not fixed:** the audit brief explicitly says not to redesign the application during this phase, and fixing this properly (e.g. a responsive card layout for admin tables below ~800px, or a scroll-shadow indicator) is a design decision with layout implications, not a one-line correction. It's listed as a recommended next-phase item in §16.

---

## 9. UX Audit

**Method:** Walked both journeys end-to-end via the live app, and read every page's copy/labels for consistency.

**USER journey** (Signup → Login → Events → Event Details → Register → Dashboard → My Registrations → Cancel): completed without confusion. Terminology is consistent throughout (`Registered`/`Cancelled` for registrations; `Upcoming`/`Ongoing`/`Completed`/`Cancelled` for events, used identically in badges everywhere they appear).

**ADMIN journey** (Login → Admin Dashboard → Create Event → Edit Event → View Registrations → Change Registration Status): completed without confusion.

**Concrete findings:**

- **No dead buttons found.** Every button in the application was exercised at least once during this audit's live testing and performed a real, correct action.
- **Minor missing feedback:** creating or editing an event redirects straight to Manage Events with no explicit "Event created" success banner — the new/updated row appearing in the list is the only confirmation. This is a common, acceptable pattern (redirect-on-success), but a brief success toast would be a small polish improvement for a future phase. Not a defect.
- **Event status does not auto-transition.** An event's status (`upcoming` → `ongoing` → `completed`) is never changed automatically based on the event's date — an admin must manually edit it. This is a deliberate scope decision (no scheduled jobs/Edge Functions, per `DEVELOPMENT_PLAN.md`'s "Out of Scope"), but it was **not previously called out explicitly** as a limitation anywhere in the docs, and a grader or user could reasonably expect otherwise. Added to Known Limitations (§15).
- **Admin table discoverability** at narrow widths, as described in §8, is as much a UX issue as a layout one — a user could think the Edit/Delete actions are missing rather than scrolled off-screen.

---

## 10. Documentation Consistency Audit

Compared every doc file against the actual implementation and live database.

| Document | Result |
|---|---|
| `01-introduction.md` | A — descriptive, no functional claims to drift |
| `02-planning.md` | A — placeholders as intended |
| `03-analysis.md` (FR1–FR20, NFR1–NFR6) | A for all FR items — every one independently re-verified live in this audit (see §3–§7). NFR3 ("no horizontal overflow") is **B** — true for every page except the admin tables at narrow widths (§8), which is a real, if minor, gap against the stated non-functional requirement. |
| `04-use-case.md` | A — all 18 use cases map to actually-implemented, actually-tested features |
| `05-context-diagram.md`, `06-dfd-level-1.md`, `07-dfd-level-2.md` | A — diagrams match the actual data flow, confirmed by tracing each process against the real code paths exercised in this audit |
| `08-er-diagram.md` | A — matches the live schema exactly, confirmed by direct introspection (§5) |
| `09-database.md` | **B → fixed during this audit.** The `prevent_role_escalation` row didn't mention the `auth.uid() is not null` exemption that was added during the prior testing phase. Updated. |
| `10-implementation.md` | A — structure/routing/component descriptions match the actual `src/` layout |
| `11-testing.md` | A — reflects real results from the prior testing phase; this audit's results are recorded separately in this file rather than merged into it, to keep the two testing passes distinguishable |
| `12-conclusion.md` | A — general summary, no specific claims to drift |
| `DEVELOPMENT_PLAN.md` | A — architecture and scope decisions match what was actually built |
| `PROJECT_STATUS.md` | A for what it claims as done/tested (all independently re-verified in this audit). Its "Known limitations" section did **not** mention the no-auto-status-transition behavior (§9) — recommended addition, see §15. |
| `README.md` | **C → fixed during this audit.** The "Set up Supabase" steps never mentioned disabling "Confirm email," which is functionally required for sign-up to behave as the app expects (an immediate session rather than an unreachable "check your email" state, since this project has no email infrastructure). A new project following the README exactly, without this step, would have a broken-seeming sign-up flow. Added as step 4. |

**No case of "claimed tested but not actually tested" (category D) was found** — every specific test claim in `PROJECT_STATUS.md` and `docs/11-testing.md` was re-verified live during this audit and held up, with the exceptions already disclosed as bugs above.

---

## 11. Security & Secrets Audit

| Check | Method | Result |
|---|---|---|
| `service_role` key in source | `grep -rn "service_role"` across all source/docs | Only appears in documentation *explaining why it's not used* — never in actual code or config |
| Hardcoded API keys/JWTs in tracked files | `grep -rln "eyJ"` across `.js`/`.jsx`/`.json`/`.md` | **None found** — the anon key exists only in `.env.local` |
| `.env.local` git-ignored | Inspected `.gitignore` | Covered by the `*.local` pattern |
| `.env.example` contains only placeholders | Read the file | Confirmed — no real values |
| `supabaseClient.js` has no hardcoded fallback | Read the file | Confirmed — throws loudly if env vars are missing, no default URL/key |
| Credentials in README/docs | Searched all `.md` files | None found |
| Git history | N/A | No git repository has been initialized for this project yet, so there is no history to audit. This is worth noting explicitly rather than silently skipping: **once a repository is initialized, run this check again before any push**, since it cannot be verified in advance of history existing. |

**No secrets exposed. No action required beyond the note above.**

---

## 12. Build/Lint/Runtime Audit

| Check | Command | Result |
|---|---|---|
| Production build | `node "node_modules/vite/bin/vite.js" build` | ✅ Success, 0 errors, both before and after all fixes in this audit |
| Lint | `node "node_modules/oxlint/bin/oxlint"` | ✅ 0 errors, 1 informational warning (explained in §2), unchanged before/after fixes |
| Stricter lint sweep | Same tool with extra rule categories forced on (`-D correctness -D suspicious -D nursery`) | Surfaced only false positives caused by rules incompatible with this project's setup (React 19's automatic JSX runtime doesn't need `React` in scope; browser globals like `console`/`document` aren't "undefined") — no real issues found this way |
| Dev server startup | `node "node_modules/vite/bin/vite.js"` | Starts cleanly |
| Browser console errors | Full smoke test: every route, visited as both a regular user and an admin, via headless Chromium | **0 unexpected console errors or page errors** across 19 page visits after all fixes were applied |
| Broken routes / missing assets | Manual navigation to every route during testing | None found |

---

## 13. Bugs Found

1. **`Events.jsx` — stale-closure bug hiding the "You're registered" badge.** `useEffect(() => { loadEvents() }, [])` had an empty dependency array, but `loadEvents()` reads `user` from `useAuth()` via closure. Since `AuthContext`'s session restore is asynchronous, `user` is always `null` on the very first render — and because the effect never re-runs, it permanently used that stale `null` for the lifetime of the page. **Impact:** on any hard page load/refresh of `/events` while logged in, registered events never showed the "You're registered" badge (this did *not* affect the actual registration data or ability to register/cancel — only this one cosmetic indicator). Confirmed live: `false` before the fix, `true` after, on an identical hard-refresh scenario.

2. **`Signup.jsx` — misleading message for an already-registered email.** With Supabase's "Confirm email" setting disabled (required for this project, since it has no email infrastructure), Supabase's `signUp` anti-enumeration behavior returns a fake "pending" response (`identities: []`, `session: null`) for an email that already has an account, rather than an explicit error. The app's error handling only checked for an explicit error message containing "already registered," so it fell through and told the user to "check your email" for a signup that was never actually created. **Impact:** a returning user mistakenly trying to sign up again would be told to check an email that would never arrive, with no indication they should just log in instead.

3. **Hidden horizontal overflow from a CSS Grid `min-width: auto` interaction.** Long unbroken text (realistically: a pasted URL or code snippet in an event description) inside `.event-details-main`, a CSS Grid item, was not force-wrapped, because (a) no `overflow-wrap` was set anywhere, and (b) even after adding it, Grid items default to `min-width: auto`, which sizes them to their content's "minimum content width" in a way that ignores soft-wrap opportunities from `overflow-wrap` for that specific automatic-sizing calculation. **Impact:** the resulting overflow was invisible to a real user — no scrollbar appeared, because the project's own global `overflow-x: hidden` (added specifically to prevent accidental horizontal scroll) suppressed it — meaning the content was silently clipped off-screen rather than either wrapping or being reachable via scroll. This is the most subtle of the three: my first automated overflow check (measuring `document.documentElement`) reported zero issues and would have missed this entirely; it was only caught by measuring actual rendered element widths directly and by visually inspecting a full-page screenshot.

No security vulnerabilities were found in this audit.

---

## 14. Bugs Fixed

| # | File(s) changed | Fix | Retest method | Before | After |
|---|---|---|---|---|---|
| 1 | `src/pages/Events.jsx` | Changed effect dependency array from `[]` to `[user]` | Playwright: log in, hard-navigate to `/events`, check for the badge | Badge visible: `false` | Badge visible: `true` |
| 2 | `src/pages/Signup.jsx` | Added a check for `data.user.identities.length === 0` to detect Supabase's anti-enumeration response and show "An account with this email already exists" instead of the generic pending-confirmation message | Playwright + network log: sign up with `student@test.com` (an existing account) | Message shown: "Account created. Check your email…" (wrong) | Message shown: "An account with this email already exists. Try logging in instead." (correct) |
| 3 | `src/index.css` (`body`), `src/pages/EventDetails.css` (`.event-details-main`, `.event-details-sidebar`) | Added `overflow-wrap: break-word` globally and `min-width: 0` to the grid items on the event details page | Measured actual widest DOM element on the affected page at 375px before and after; also re-ran a full 7-breakpoint × 11-page sweep afterward | `body.scrollWidth: 8272` vs `clientWidth: 375` (overflowing) | `body.scrollWidth: 375` vs `clientWidth: 375` (no overflow); full re-sweep found 0 remaining hidden-overflow instances anywhere in the app |

All three fixes were followed by a full lint + production build + a complete cross-role smoke test (19 page visits across both a regular user and an admin account) showing **0 console/page errors**, confirming no regressions were introduced.

Additionally, two documentation corrections were made (not code bugs): `README.md` now documents the required "Confirm email" OFF setup step, and `docs/09-database.md` now documents the `prevent_role_escalation` trigger's `auth.uid() is not null` exemption.

---

## 15. Remaining Limitations

- **Admin tables are not fully responsive below ~1024px** (§8) — functional via horizontal scroll, but with no visible affordance. Not fixed in this audit (design change, out of scope for an audit-only phase).
- **Event status does not auto-transition** based on date/time; admins must manually mark events as ongoing/completed. Deliberate scope decision, now explicitly documented.
- **No self-serve admin promotion** — remains a manual SQL step by design.
- **No automated/CI test suite** — all testing (this audit included) was live but manual/scripted-ad-hoc, not integrated into a CI pipeline.
- **Some logic duplication** (registration counting) across 4 files — functionally correct everywhere, but a candidate for consolidation.
- **No git repository yet** — the security audit's git-history check could not be performed for lack of a repository to check.
- All limitations previously listed in `PROJECT_STATUS.md` remain accurate and were not contradicted by this audit.

---

## 16. Recommended Next Phase

In priority order:

1. **Responsive admin tables.** Convert `AdminEvents.jsx` / `AdminEventRegistrations.jsx` to a stacked card layout below ~800px, or at minimum add a visible scroll-shadow/affordance to `.admin-table-scroll` so the hidden columns are discoverable.
2. **Document (or build) the event-status lifecycle.** Either explicitly document that status transitions are manual admin actions (done, this audit), or — if desired for a future phase — add a computed "effective status" derived from the event's date/time for *display* purposes only, without needing a scheduled job.
3. **Consolidate the duplicated registration-counting logic** into a single helper in `utils/eventHelpers.js`.
4. **Initialize a git repository** and re-run the secrets audit against its history before any push, especially before ever adding a `service_role` key to any local tooling.
5. **Add success feedback (toast/banner)** after admin create/edit actions, for polish rather than correctness.

No AI, payments, notifications, chat, maps, or other out-of-scope features are recommended — consistent with the project's stated scope throughout.
