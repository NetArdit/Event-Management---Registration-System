# 3.2.2 DFD Level 2 — Expansion of "3.0 Manage Registration"

This diagram expands process 3.0 from the Level 1 DFD into its sub-processes, showing how a registration request is validated both in the application and, as a second line of defense, by the database itself.

```mermaid
flowchart TB
    User[User]

    P31((3.1\nCheck\nEligibility))
    P32((3.2\nCreate / Reactivate\nRegistration))
    P33((3.3\nCancel\nRegistration))
    P34((3.4\nEnforce Registration\nRules — DB trigger))

    D2[(Events)]
    D3[(Registrations)]

    User -- "click Register" --> P31
    P31 <-- "read status, capacity" --> D2
    P31 <-- "read existing registration\nfor this user/event" --> D3
    P31 -- "eligible?" --> P32
    P31 -- "not eligible\n(full / cancelled)" --> User

    P32 -- "insert or update row\n(status = registered)" --> P34
    P34 <-- "re-check status,\ncount active registrations" --> D2
    P34 <-- "re-check for capacity" --> D3
    P34 -- "reject if full/cancelled\n(raises DB error)" --> P32
    P34 -- "accept" --> D3
    P32 -- "success / error message" --> User

    User -- "click Cancel" --> P33
    P33 -- "update row\n(status = cancelled)" --> D3
    P33 -- "confirmation" --> User
```

## Why validation happens twice

- **3.1 Check Eligibility** runs in the React app before showing the "Register" button as enabled, giving the user immediate feedback (e.g. a disabled "Event Full" button) without a round trip.
- **3.4 Enforce Registration Rules** is a PostgreSQL trigger (`enforce_registration_rules`, see [`supabase/migrations/001_initial_schema.sql`](../supabase/migrations/001_initial_schema.sql)) that re-checks the same conditions directly in the database on every insert/update to `registrations`. This closes the race condition where two users could both pass the client-side check for the last spot at the same time — only one of the two database writes will succeed once capacity is reached, and the trigger raises an error the UI displays to the losing request.
- Duplicate registrations are additionally prevented by a `unique (event_id, user_id)` constraint on the `registrations` table, which is why 3.2 is "Create **or Reactivate**": a user who previously cancelled and registers again updates their existing row rather than inserting a second one.
