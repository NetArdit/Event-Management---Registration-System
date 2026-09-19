# 2. Planning

## 2.1 Project duration

This is a university faculty project developed as a single, focused implementation effort rather than a long multi-sprint project. Suggested stages and their approximate share of effort:

| Stage                          | Description                                                               | Share of effort |
| ------------------------------ | ------------------------------------------------------------------------- | --------------- |
| 1. Requirements & planning     | Define scope, roles, entities, out-of-scope items (`DEVELOPMENT_PLAN.md`) | 10%             |
| 2. Database design             | Schema, constraints, RLS policies, triggers (`supabase/migrations/`)      | 15%             |
| 3. Application scaffolding     | Vite + React setup, routing, auth context, shared components              | 15%             |
| 4. Core feature implementation | Browse/search/filter events, event details, registration flow             | 25%             |
| 5. Admin features              | Admin dashboard, event CRUD, registration management                      | 20%             |
| 6. Styling & responsiveness    | Consistent CSS, mobile layout, loading/empty/error states                 | 5%              |
| 7. Documentation & diagrams    | This `docs/` folder, Mermaid diagrams                                     | 5%              |
| 8. Testing & fixes             | Manual test pass, bug fixes                                               | 5%              |

_(Fill in actual calendar dates here, e.g. "Week 1: stages 1–2", "Week 2: stages 3–4", etc., to match your course's timeline.)_

## 2.2 Project staff

| Role        | Name             |
| ----------- | ---------------- |
| Developer   | Ardit Selmani    |
| Course      | Projekt II       |
| Instructor  | Ramadan Dervishi |
| Institution | Kolegji AAB      |

## Development stages (summary)

1. **Analysis** — identify actors (User, Admin), use cases, and the minimal data model needed to support them.
2. **Design** — design the database schema and RLS policies first, since authorization is enforced at that layer; then design routes and component structure around it.
3. **Implementation** — build shared UI components first (Navbar, EventCard, forms, loading/empty/error states), then pages, then wire them to Supabase.
4. **Testing** — manually exercise every user flow listed in [`11-testing.md`](11-testing.md) against a real Supabase project.
5. **Documentation** — write this documentation set and the Mermaid diagrams to reflect what was actually built.
