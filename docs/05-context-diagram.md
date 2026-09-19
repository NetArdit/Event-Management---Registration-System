# 3.2 Context Diagram

The Context Diagram (DFD Level 0) shows the system as a single process, and the external entities that interact with it. Note that "Supabase" is drawn as an external system because the React frontend is a client of it (authentication, database, and enforcement of access rules all happen there) — there is no custom backend server in this project.

```mermaid
flowchart TB
    User([User])
    Admin([Admin])
    Supabase[("Supabase\n(Auth + PostgreSQL + RLS)")]

    System(("Event Management &\nRegistration System"))

    User -- "sign up / log in\nsearch, register, cancel\nview dashboard/profile" --> System
    System -- "event listings, registration\nstatus, dashboard data" --> User

    Admin -- "log in\ncreate/edit/delete events\nmanage registrations" --> System
    System -- "events, statistics,\nregistrant lists" --> Admin

    System -- "auth requests, queries,\ninserts/updates" --> Supabase
    Supabase -- "session tokens, query results,\nRLS-filtered rows" --> System
```

## Description

- **User** and **Admin** are the two human external entities. They interact only through the React application in the browser.
- **Supabase** is the single external system: it provides authentication (issuing/validating session tokens), the PostgreSQL database (storing events, registrations, and profiles), and Row Level Security (deciding, per request, which rows a given authenticated user is allowed to read or write).
- The **Event Management & Registration System** process represents the whole React single-page application — there is intentionally no separate custom backend process, since Supabase's auto-generated API plus RLS plays that role.
