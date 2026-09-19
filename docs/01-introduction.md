# 1. Introduction

## 1.1 Purpose

The **Event Management & Registration System** is a web application that lets a university manage events and lets students and staff discover and register for them online.

Before a system like this, event organizers typically relied on paper sign-up sheets, spreadsheets shared over email, or ad-hoc social media posts. This creates several problems:

- No single, authoritative place to see all upcoming events.
- No reliable way to know how many people have registered, or whether an event is full.
- No way for a student to see, at a glance, which events they are registered for.
- Manual, error-prone tracking of registrations by event organizers.

This project addresses those problems with a small, focused web application built around two roles:

- **Users** (students/staff) can browse events, search and filter them, register or cancel a registration, and track their own registrations from a personal dashboard.
- **Admins** (event organizers) can create, edit, and cancel events, and view/manage who has registered for each event, from an admin dashboard with basic statistics.

The system enforces real business rules — a user cannot register twice for the same event, cannot register for a cancelled event, and cannot register once an event is full — both in the user interface and, more importantly, at the database level.

## 1.2 Technology

The application is a **frontend-only single-page application** backed entirely by **Supabase** as a Backend-as-a-Service. There is no custom backend server.

| Layer | Technology | Reason |
|---|---|---|
| Build tool | **Vite** | Fast dev server and build, minimal configuration, standard for modern React projects. |
| UI library | **React 19** | Component-based UI, widely taught and industry-standard. |
| Routing | **React Router v7** | Client-side routing for a single-page application with protected/admin-only routes. |
| Styling | **Plain CSS** (CSS variables, no framework) | Keeps the project dependency-light and easy to explain; avoids "AI-generated" boilerplate look of heavy UI kits. |
| Backend / database | **Supabase (PostgreSQL)** | Managed Postgres with a REST API generated automatically, so no custom backend server is needed. |
| Authentication | **Supabase Auth (email/password)** | Handles password hashing, sessions, and tokens without custom code. |
| Authorization | **PostgreSQL Row Level Security (RLS)** | Enforces who can read/write which rows directly in the database — not just hidden in the UI. |
| State management | **React Context** (`AuthContext`) | Sufficient for the app's scope; a state library like Redux would be unnecessary overhead. |

No paid services, custom servers, AI features, payment processors, or messaging infrastructure are used. The full list of technologies and the reasoning behind each decision is in [`DEVELOPMENT_PLAN.md`](../DEVELOPMENT_PLAN.md) at the project root.

### Target users

- **Students and staff** who want to discover and attend university events.
- **Event organizers / administrators** (e.g. student affairs staff, faculty running workshops) who need a simple tool to publish events and see who is coming.
