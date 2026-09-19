-- ============================================================================
-- Event Management & Registration System — Initial Schema
-- ============================================================================
-- Tables: profiles, events, registrations
-- Includes: constraints, triggers, and Row Level Security (RLS) policies.
-- Run this once against a fresh Supabase project (SQL Editor, or `supabase db push`).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES
-- One row per auth.users record. Stores app-level data (name, role).
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  -- Copied from auth.users at sign-up so admins can identify registrants
  -- (auth.users itself is never queried directly from the frontend).
  email text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. EVENTS
-- ----------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  event_date date not null,
  start_time time not null,
  end_time time not null,
  location text not null,
  category text not null,
  capacity integer not null check (capacity > 0),
  image_url text,
  status text not null default 'upcoming' check (status in ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint end_after_start check (end_time > start_time)
);

create index events_status_idx on public.events (status);
create index events_category_idx on public.events (category);
create index events_event_date_idx on public.events (event_date);

-- ----------------------------------------------------------------------------
-- 3. REGISTRATIONS
-- One row per user/event registration attempt. Unique per (event, user) so a
-- cancelled registration is reused (status flipped back to 'registered')
-- rather than creating duplicate rows.
-- ----------------------------------------------------------------------------
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'registered' check (status in ('registered', 'cancelled')),
  registered_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index registrations_event_id_idx on public.registrations (event_id);
create index registrations_user_id_idx on public.registrations (user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Returns true if the currently authenticated user is an admin.
-- SECURITY DEFINER + owned by a privileged role so it can read `profiles`
-- without recursively triggering the `profiles` RLS policy that calls it.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Keeps `updated_at` current on row updates.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

-- Creates a `profiles` row automatically whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Prevents a non-admin from changing their own `role` via a profile update
-- (defense in depth on top of RLS, since RLS cannot restrict individual columns).
-- Only applies to requests made through an authenticated session (auth.uid()
-- is set) — direct SQL run by the project owner (e.g. in the SQL Editor, to
-- promote the first admin) has no auth.uid() and is intentionally exempt.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and new.role <> old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_role_escalation
before update on public.profiles
for each row execute function public.prevent_role_escalation();

-- Enforces registration business rules directly in the database:
--  - cannot register for a cancelled event
--  - cannot register once the event is at capacity
-- Runs on INSERT and UPDATE so both new registrations and re-activated
-- (previously cancelled) registrations are checked.
create or replace function public.enforce_registration_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_capacity integer;
  v_registered_count integer;
begin
  select status, capacity into v_status, v_capacity
  from public.events
  where id = new.event_id;

  if v_status is null then
    raise exception 'Event does not exist';
  end if;

  if new.status = 'registered' then
    if v_status = 'cancelled' then
      raise exception 'Cannot register for a cancelled event';
    end if;

    select count(*) into v_registered_count
    from public.registrations
    where event_id = new.event_id
      and status = 'registered'
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

    if v_registered_count >= v_capacity then
      raise exception 'Event is full';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_enforce_registration_rules
before insert or update on public.registrations
for each row execute function public.enforce_registration_rules();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;

-- ---- profiles ----------------------------------------------------------

create policy "Profiles are viewable by owner or admin"
on public.profiles for select
using (auth.uid() = id or public.is_admin());

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- No INSERT/DELETE policies: profile rows are created only by the
-- handle_new_user trigger and removed only via auth.users cascade.

-- ---- events -------------------------------------------------------------

create policy "Events are viewable by everyone"
on public.events for select
using (true);

create policy "Admins can create events"
on public.events for insert
with check (public.is_admin());

create policy "Admins can update events"
on public.events for update
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete events"
on public.events for delete
using (public.is_admin());

-- ---- registrations -------------------------------------------------------

create policy "Users can view their own registrations, admins view all"
on public.registrations for select
using (auth.uid() = user_id or public.is_admin());

create policy "Users can register themselves"
on public.registrations for insert
with check (auth.uid() = user_id);

create policy "Users can update their own registrations, admins any"
on public.registrations for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

-- No DELETE policy: cancellation is modeled as status = 'cancelled', not row deletion.
