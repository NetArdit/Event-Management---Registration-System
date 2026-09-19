# 3. Analysis

## System requirements

- A modern web browser (Chrome, Firefox, Edge, Safari) — desktop or mobile.
- Internet access to reach the Supabase-hosted backend.
- No installation required for end users; the developer needs Node.js to build/run the project locally.

## Actors

| Actor | Description |
|---|---|
| **Guest (unauthenticated visitor)** | Anyone browsing the site without an account. Can view the landing page and browse/search events, but cannot register. |
| **User** | An authenticated student/staff account. Can browse events, register/cancel registrations, and manage their own profile. |
| **Admin** | An authenticated account with the `admin` role. Has all User capabilities plus full event management and registration oversight. |
| **Supabase (system)** | The backend platform providing authentication, database storage, and access control (RLS). Not a human actor, but shown in the Context Diagram as an external system. |

## Functional requirements

### Guest / User
- FR1: A guest can create an account with email and password.
- FR2: A user can log in and log out.
- FR3: A user's session persists across page reloads.
- FR4: A guest or user can browse all events.
- FR5: A guest or user can search events by title.
- FR6: A guest or user can filter events by category and by status.
- FR7: A guest or user can open an event's details page.
- FR8: A user can register for an event, if the event is not cancelled, not completed, and not full.
- FR9: A user cannot register twice for the same event (duplicate prevention).
- FR10: A user can cancel their own registration.
- FR11: A user can view all their registrations (active and cancelled) on a dedicated page.
- FR12: A user can view a dashboard summarizing their upcoming registered events and registration counts.
- FR13: A user can view and update their basic profile information (full name).

### Admin
- FR14: An admin can view a dashboard with basic statistics (total events, upcoming events, active registrations, total users).
- FR15: An admin can create a new event.
- FR16: An admin can edit an existing event.
- FR17: An admin can delete an event (with confirmation).
- FR18: An admin can view all events regardless of status.
- FR19: An admin can view the list of participants registered for a given event.
- FR20: An admin can change a registration's status (e.g. cancel a participant's registration on their behalf, or reinstate one).

## Non-functional requirements

- NFR1 (Security): Authorization must be enforced at the database level (RLS), not only hidden in the UI. A non-admin must not be able to modify events or other users' registrations even via direct API calls.
- NFR2 (Usability): The interface must be understandable without training — clear labels, visible feedback for loading/empty/error states, and confirmation before destructive actions.
- NFR3 (Responsiveness): The layout must work without horizontal overflow on both desktop and mobile viewport widths.
- NFR4 (Data integrity): Duplicate registrations, registrations for cancelled events, and registrations beyond capacity must be impossible, enforced by database constraints/triggers as a second line of defense behind the UI.
- NFR5 (Maintainability): The codebase must use a clear, conventional React project structure (components/pages/context/lib) that a student can explain to an examiner.
- NFR6 (Cost): The system must run entirely on free-tier services (Supabase free tier), with no paid APIs.

## Analysis summary

The system's core complexity is not in its UI but in getting **authorization right**: a User and an Admin see mostly the same pages, but what they're allowed to *do* differs, and that difference must hold even if someone bypasses the UI and calls the Supabase API directly. This is why the Analysis and Design phases centered on the database schema and its RLS policies before UI work began — see [`08-er-diagram.md`](08-er-diagram.md) and [`09-database.md`](09-database.md).

See [`04-use-case.md`](04-use-case.md) for the detailed use case descriptions and diagram.
