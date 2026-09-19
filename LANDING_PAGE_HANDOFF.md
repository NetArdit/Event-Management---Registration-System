# Landing Page Handoff

Practical reference for building `src/pages/Landing.jsx` and `src/pages/Landing.css`. Everything below reflects the application exactly as it currently exists — nothing here describes planned or hypothetical functionality.

---

## 1. Current application routes

Defined in `src/App.jsx`. The landing page owns only `/`; every other route is independent and unaffected by anything you do to `Landing.jsx`/`Landing.css`.

| Route | Page | Access |
|---|---|---|
| `/` | **Landing (yours)** | Public |
| `/events` | Browse Events (search + filter) | Public |
| `/events/:id` | Event Details (register/cancel) | Public to view; login required to register |
| `/login` | Log in | Public |
| `/register` | Sign up | Public |
| `/dashboard` | User dashboard | Logged-in users |
| `/my-registrations` | User's registrations (active/cancelled tabs) | Logged-in users |
| `/profile` | Edit full name | Logged-in users |
| `/admin` | Admin dashboard (stats) | Admins only |
| `/admin/events` | Manage Events | Admins only |
| `/admin/events/new` | Create Event | Admins only |
| `/admin/events/:id/edit` | Edit Event | Admins only |
| `/admin/events/:id/registrations` | View/manage registrants | Admins only |
| `*` | 404 page | Public |

## 2. Main user workflow

1. Sign up (`/register`) or log in (`/login`).
2. Browse events at `/events` — search by title, filter by category and status.
3. Open an event at `/events/:id` — see full details, date/time, location, capacity, and a Register button.
4. Register (or cancel, or re-register later) directly from that page.
5. Track registrations from `/my-registrations` (Registered / Cancelled tabs) or get a summary on `/dashboard` (active registrations, upcoming events, recent activity).
6. Edit their display name on `/profile`.

## 3. Main admin workflow

1. Log in as an admin account → `/admin` shows 4 live stats (total events, upcoming events, active registrations, total users).
2. Create/edit events (`/admin/events/new`, `/admin/events/:id/edit`) — title, description, date, start/end time, location, category, capacity, optional image URL, status.
3. Manage all events from `/admin/events` (edit, delete with confirmation, jump to that event's registrants).
4. View and manage a specific event's registrants at `/admin/events/:id/registrations` — see name/email/status, cancel or reinstate a registration.

## 4. Existing reusable components you can use

All in `src/components/`. Import path from `Landing.jsx` is `../components/<Name>`.

| Component | What it needs | Notes |
|---|---|---|
| `EventCard` | `{ event, registeredCount, userRegistrationStatus }` | Renders a full event summary card (title, date, location, category badge, status badge, spots-left) and links to `/events/:id`. Useful if you want to feature 1–3 real events on the landing page. |
| `StatCard` | `{ label, value }` | Simple stat tile. Used on the user and admin dashboards. Could work for a "X events, Y students registered" style section — but see §8 on what data is safe to show. |
| `LoadingState` | `{ label }` | Spinner + text, for if you fetch anything async. |
| `EmptyState` | `{ title, message, action }` | Consistent "nothing here" block. |
| `ErrorState` | `{ title, message, onRetry }` | Consistent error block. |

**Not relevant to a landing page** (skip these): `EventForm`, `RegistrationButton`, `Modal`, `ProtectedRoute`, `AdminRoute` — all tied to authenticated/admin flows.

`Navbar` and `Footer` are **not** imported by `Landing.jsx` yourself — see §14, they wrap every page automatically.

## 5. Existing CSS variables you can use

All defined once in `src/index.css` under `:root`. Landing.css can reference any of these directly.

```css
/* Colors */
--color-primary: #2952a3;
--color-primary-dark: #1e3d7a;
--color-primary-light: #e8eefb;
--color-danger: #b3261e;
--color-danger-light: #fbeaea;
--color-success: #1e7a4c;
--color-success-light: #e7f5ee;
--color-warning: #9a6b00;
--color-warning-light: #fdf3dd;

--color-text: #1c2430;
--color-text-muted: #5c6675;
--color-border: #dde2ea;
--color-surface: #ffffff;
--color-background: #f5f7fa;

/* Radii */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;

/* Shadows */
--shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.06);
--shadow-md: 0 4px 12px rgba(16, 24, 40, 0.08);

/* Spacing scale */
--space-1: 4px;  --space-2: 8px;  --space-3: 12px;
--space-4: 16px; --space-5: 24px; --space-6: 32px; --space-7: 48px;

/* Font */
--font-sans: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
```

The whole app is **light mode only** (`color-scheme: light` is set globally) — there is no dark-mode variant to match or break.

## 6. Existing buttons/styles/classes you can reuse

All global, defined in `src/index.css`, usable directly by class name with no import needed:

| Class | Effect |
|---|---|
| `.btn` (base) + `.btn-primary` / `.btn-secondary` / `.btn-danger` / `.btn-outline` | Button color variants. Works on `<button>` or an `<a>`/`<Link>` styled as a button. |
| `.btn-sm` | Smaller button padding/font. |
| `.btn-block` | Full-width button. |
| `.container` | Centers content, `max-width: 1120px`, responsive side padding (`--space-5`, drops to `--space-4` under 640px). This is the standard content-width wrapper used on every page. |
| `.card` | White surface, border, rounded corners, subtle shadow — the base look for cards/panels site-wide. |
| `.badge` + `.badge-upcoming` / `.badge-ongoing` / `.badge-completed` / `.badge-cancelled` / `.badge-registered` / `.badge-neutral` | Small pill labels, used for event/registration status everywhere. |
| `.page-header`, `.page-section` | Standard vertical spacing rhythm used to open/close each page's content. |
| `.dashboard-stats` | Responsive auto-fit grid for a row of `StatCard`s. |
| `.events-grid` | Responsive auto-fill grid (min 260px per card) — what `EventCard`s are laid out in on `/events`. |

You are **not required** to use any of these — a fully custom `Landing.css` is equally fine, as instructed. They're here in case matching the rest of the app's visual language is what you want.

## 7. Available `AuthContext` values

Import: `import { useAuth } from '../context/AuthContext'`. Call `useAuth()` inside `Landing()`.

```js
const { user, profile, isAdmin, loading, session } = useAuth()
```

| Value | Type | Meaning |
|---|---|---|
| `user` | object or `null` | The logged-in Supabase auth user, or `null` if logged out. Check `if (user)` to branch content. |
| `profile` | object or `null` | Row from `profiles`: `{ id, full_name, role, created_at }`. `profile?.full_name` for a greeting. |
| `isAdmin` | boolean | `true` if `profile.role === 'admin'`. |
| `loading` | boolean | `true` while the session is still being restored on first load — useful if you don't want to flash "logged out" content for a split second. |
| `session` | object or `null` | Raw Supabase session; you almost certainly want `user`/`profile` instead. |

Functions are also exposed (`signIn`, `signUp`, `signOut`, `refreshProfile`) but a landing page has no reason to call them directly — link to `/login` / `/register` instead.

## 8. What Supabase data the landing page can safely access, if any

You can query Supabase directly from `Landing.jsx` exactly like every other page does, via:

```js
import { supabase } from '../lib/supabaseClient'
```

**Safe and already-public per the database's RLS policies:**
- `supabase.from('events').select('*')` — the `events` table is readable by *everyone*, including logged-out visitors (RLS: `SELECT` policy is `true`). Fetching a few upcoming events to feature on the landing page is fully supported and safe.

**Not accessible / not appropriate here:**
- `registrations` and `profiles` are protected by RLS to each user's own rows (or admins) — a logged-out or non-admin landing-page visitor cannot read other people's data, and you shouldn't try to build any "total registrations" style stat here without being logged in as admin (which a landing page visitor generally isn't).
- There is **no aggregate/public stats endpoint** (e.g. "500+ students registered") in this app. Do not display invented numbers — if you want a stats section, it would need to come from a real, permitted query (e.g. a public count of `events`), not from `registrations`/`profiles` counts, which are not visible to an anonymous visitor.

**If you don't want to fetch anything:** that's completely fine. The current placeholder fetches nothing and is a valid design choice — a static hero + CTA needs no Supabase calls at all.

## 9. Files you should NOT modify

- `src/App.jsx` — route table. Don't add/remove/rename routes, don't change what `/` renders.
- `src/components/Navbar.jsx`, `src/components/Navbar.css`
- `src/components/Footer.jsx`, `src/components/Footer.css`
- `src/context/AuthContext.jsx`
- `src/lib/supabaseClient.js`
- `src/index.css` — shared global styles/variables used by every page; editing this affects the whole app, not just yours.
- Anything under `src/pages/` other than `Landing.jsx`/`Landing.css`, and anything under `src/pages/admin/`.
- `supabase/` (migrations, seed data) and `.env.local`.

## 10. Files that are safe for you to modify

- `src/pages/Landing.jsx`
- `src/pages/Landing.css`

That's it — these two files are fully yours, and nothing else in the app reads from either of them.

## 11. How the landing page is connected to React Router

In `src/App.jsx`:

```jsx
<Route path="/" element={<Landing />} />
```

`Landing` is a plain default-exported function component, rendered with no props, inside `<main className="app-main">` which itself is inside `<Routes>`, which itself is inside the `<Navbar />` / `<Footer />` shell in `App.jsx`. To navigate to other routes from your page, use React Router's `Link` (already used in the current placeholder):

```jsx
import { Link } from 'react-router-dom'
<Link to="/events">Browse Events</Link>
```

Use real `to="/events"` / `to="/register"` / `to="/login"` paths — every route in §1 is valid to link to.

## 12. Important layout constraints

- The page renders inside `<main className="app-main">`, which has `flex: 1` inside a flex column `#root` — this pushes the footer down on short pages, so you don't need to manually manage min-height/footer positioning yourself.
- Global reset already applied: `box-sizing: border-box` on everything, `overflow-x: hidden` on `html`/`body` (so accidental slight overflow won't create a horizontal scrollbar — but you should still avoid causing overflow, see §13).
- Global `overflow-wrap: break-word` is set on `body` — long text will wrap rather than overflow, but grid/flex children can still need an explicit `min-width: 0` if you build a multi-column layout with long unbroken text inside it (this exact issue was found and fixed elsewhere in the app during a recent audit).
- There's no dark mode to support (`color-scheme: light` globally).
- No image assets currently exist in the project (no logo file, no hero image) — if your design needs one, you'll need to add the asset file yourself under `src/assets/` or `public/`.

## 13. Responsive requirements

The rest of the app is built and tested (via headless-browser checks at 320/375/390/768/1024/1280/1440px) to have **zero horizontal overflow at any width**. Whatever you build should hold to the same standard:
- Test at very narrow widths (320–375px) specifically — that's where issues most commonly show up (long unbroken text, fixed-width elements, side-by-side layouts that don't stack).
- The site-wide breakpoint convention used elsewhere is `@media (max-width: 640px)` for tight content padding and `@media (max-width: 860px)` for the navbar's mobile menu — you're free to use your own breakpoints, but these are the ones already in use if you want visual consistency.
- If you use CSS Grid or Flexbox with long text content in a child, remember to set `min-width: 0` on that child if it's misbehaving — this is a real gotcha that has already bitten this codebase once.

## 14. Existing Navbar/Footer behavior you should know

You do not render `<Navbar />` or `<Footer />` yourself — `App.jsx` already wraps every page (including yours) with both, automatically. Behavior you should be aware of when designing your page's own hero/top section so it doesn't visually clash:

- **Navbar**: white background, bottom border, **sticky to the top** (`position: sticky; top: 0`) at all times, `64px` tall. Shows "Campus Events" brand link, "Browse Events" link, and (if logged out) "Log in" + a "Sign up" button; if logged in, adds "Dashboard", "My Registrations", the user's name linking to `/profile`, and a "Log out" button; if admin, also adds an "Admin" link. Below 860px width it collapses into a hamburger toggle.
- **Footer**: simple, always at the bottom, white background, top border, two lines of muted small text ("Campus Events — Event Management & Registration System" and "University faculty project · built with React & Supabase"). Not customizable from your page, and not something you need to account for beyond knowing it's always present below your content.

Because the navbar is sticky, don't design a full-bleed hero that assumes it can scroll under a transparent nav — the nav will always sit solidly on top of your content when scrolling.

## 15. Recommended landing-page sections, based only on implemented functionality

These map directly to what actually exists — nothing here requires new features:

1. **Hero** — name the app, one-sentence value proposition ("Discover and register for university events in one place" — already the current placeholder's copy, feel free to reuse or rewrite), primary CTA to `/events`, secondary CTA to `/register` (this is exactly the current placeholder's structure).
2. **Browse Events CTA** — a section pointing at real, live functionality: search by title, filter by category and status, all on `/events`. You could even embed a couple of real `EventCard`s here (see §4, §8) pulled from a live `supabase.from('events')` query, since that table is public.
3. **How It Works** — a simple 3–4 step explainer matching the *actual* user flow: (1) Create an account, (2) Browse and find an event, (3) Register with one click, (4) Track it from your dashboard / cancel any time. Don't describe steps that don't exist (e.g. no payment step, no approval step — registration is immediate, subject only to capacity/status rules).
4. **What you can do** (User vs. organizer split) — two short columns: what a **student/user** can do (browse, search, filter, register, cancel, track registrations, edit profile) vs. what an **event organizer/admin** can do (create/edit/cancel events, see who's registered, basic stats). This matches §2/§3 exactly — don't invent capabilities beyond what's listed there.
5. **Registration explanation** — a short, honest note on how registration works: instant registration subject to real capacity limits, duplicate registration is prevented, cancelling frees your spot for someone else and can be undone by registering again later. This is real, implemented, database-enforced behavior (see `AUDIT_REPORT.md` §6 if you want the technical detail) — safe to describe confidently.
6. **Final CTA** — repeat the `/register` (or `/events` for a logged-out visitor who'd rather browse first) call to action at the bottom of the page.

**Sections to avoid inventing:** no "testimonials" (no real user content exists to show), no "trusted by X universities" or numeric stats banners (no real public aggregate data exists to back them, see §8), no payment/pricing section, no map/location-finder section, no notification/reminder messaging — none of these exist in the implemented system.
