# Conclusion

## Summary

The Event Management & Registration System is a frontend-only React application backed by Supabase (PostgreSQL, Auth, and Row Level Security) that lets students browse and register for university events, and lets admins manage those events and their registrants. The project deliberately stayed within a scope appropriate for a faculty project: two roles, three database tables, and a focused set of features — no payments, no messaging infrastructure, no AI, no custom backend server.

The main technical achievement is that **authorization is enforced twice, independently**: once in the UI (for immediate feedback and a clean user experience) and once in the database via RLS policies and triggers (for actual security). This means the system remains correct even against direct API access that bypasses the React app entirely — a property that is easy to describe but, as the [`09-database.md`](09-database.md) and [`07-dfd-level-2.md`](07-dfd-level-2.md) documents show, took deliberate schema and trigger design to achieve (e.g. the capacity/duplicate/cancelled-event checks in `enforce_registration_rules`, and the role-escalation guard in `prevent_role_escalation`).

## What was learned / demonstrated

- Designing a relational schema around real business rules (uniqueness, capacity, status transitions) rather than just "fields that fit the UI".
- Implementing authorization as a database-level concern (RLS) rather than only conditionally rendering UI.
- Structuring a non-trivial React application (11+ routes, role-based access, shared component library) without a state management library, by keeping context usage minimal and scoped to authentication.
- Producing analysis artifacts (use cases, context diagram, DFDs, ER diagram) that reflect an actually-built system rather than a hypothetical one.

## Known limitations

See [`PROJECT_STATUS.md`](../PROJECT_STATUS.md) at the project root for the current, up-to-date list of completed features, tested flows, and known limitations. In summary, the largest intentional gaps are: no email-based password reset flow, no self-serve admin promotion (must be done via SQL), and no automated test suite (testing was manual, per the project's scope).

## Possible extensions (not implemented, out of scope)

- Email notifications on registration/cancellation (would require Supabase Edge Functions + an email provider).
- Waitlists for full events.
- Automated (unit/integration) test suite.
- Event categories managed as a separate table instead of free-text, if stricter data governance were needed.

These were deliberately left out to keep the project's scope proportionate to a faculty assignment, per [`DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md)'s "Out of Scope" section.
