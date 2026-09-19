# 3.2.1 DFD Level 1

DFD Level 1 expands the single system process from the Context Diagram into its major functional processes, and introduces the data stores they read from and write to.

```mermaid
flowchart TB
    User[User]
    Admin[Admin]

    P1((1.0\nManage\nAuthentication))
    P2((2.0\nBrowse & Search\nEvents))
    P3((3.0\nManage\nRegistration))
    P4((4.0\nManage\nProfile))
    P5((5.0\nAdminister\nEvents))
    P6((6.0\nView Admin\nStatistics))

    D1[(Profiles)]
    D2[(Events)]
    D3[(Registrations)]

    User -- "email, password" --> P1
    P1 -- "session" --> User
    P1 <-- "credentials / profile row" --> D1

    User -- "search text, filters" --> P2
    P2 -- "event list, event details" --> User
    P2 -- "read" --> D2
    P2 -- "read (counts)" --> D3

    User -- "register / cancel" --> P3
    P3 -- "registration status" --> User
    P3 <-- "read event status/capacity" --> D2
    P3 <-- "create / update row" --> D3

    User -- "profile edits" --> P4
    P4 -- "updated profile" --> User
    P4 <-- "read / update" --> D1

    Admin -- "email, password" --> P1

    Admin -- "create / edit / delete event" --> P5
    P5 -- "confirmation" --> Admin
    P5 <-- "write" --> D2

    Admin -- "view registrants,\nchange status" --> P6
    P6 -- "registrant list,\nstatistics" --> Admin
    P6 <-- "read" --> D1
    P6 <-- "read / update" --> D2
    P6 <-- "read / update" --> D3
```

## Process descriptions

| Process | Description | Reads | Writes |
|---|---|---|---|
| 1.0 Manage Authentication | Sign up, log in, log out, session restore | Profiles (to load role) | Profiles (auto-created on sign up via trigger) |
| 2.0 Browse & Search Events | List, search by title, filter by category/status, view details | Events, Registrations (for counts) | — |
| 3.0 Manage Registration | Register for an event, cancel a registration | Events (status/capacity), Registrations | Registrations |
| 4.0 Manage Profile | View/update full name | Profiles | Profiles |
| 5.0 Administer Events | Create, edit, delete events | Events | Events |
| 6.0 View Admin Statistics | Dashboard counts, view/manage registrants per event | Profiles, Events, Registrations | Registrations (status changes) |

Process 3.0 (Manage Registration) is the most business-rule-heavy process in the system, so it is expanded further in [`07-dfd-level-2.md`](07-dfd-level-2.md).
