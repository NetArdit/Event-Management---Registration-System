-- ============================================================================
-- DEVELOPMENT / DEMO SEED DATA — NOT part of application logic.
-- ============================================================================
-- Optional. Run manually in the Supabase SQL Editor after 001_initial_schema.sql
-- if you want sample events to browse while developing/demoing the app.
--
-- This file does NOT create any users — Supabase Auth users must be created
-- through the app's sign-up form (or the Supabase dashboard) because
-- passwords cannot be inserted via plain SQL. After creating a user normally,
-- you can promote it to admin with:
--
--   update public.profiles set role = 'admin' where id = '<user-uuid-here>';
--
-- The INSERTs below use `created_by = null` so they work before any admin
-- account exists. Re-running this file will create duplicate demo events.
-- ============================================================================

insert into public.events
  (title, description, event_date, start_time, end_time, location, category, capacity, status)
values
  (
    'Introduction to Web Development',
    'A hands-on workshop covering HTML, CSS, and JavaScript fundamentals for beginners.',
    current_date + interval '7 days',
    '10:00', '13:00',
    'Computer Science Building, Room 204',
    'Workshop',
    30,
    'upcoming'
  ),
  (
    'Annual Career Fair',
    'Meet recruiters from local and national companies hiring for internships and full-time roles.',
    current_date + interval '14 days',
    '09:00', '16:00',
    'University Main Hall',
    'Career',
    200,
    'upcoming'
  ),
  (
    'Guest Lecture: Databases at Scale',
    'An industry engineer discusses how large-scale systems design and operate relational databases.',
    current_date + interval '3 days',
    '14:00', '15:30',
    'Auditorium B',
    'Lecture',
    120,
    'upcoming'
  ),
  (
    'Student Chess Tournament',
    'Single-elimination chess tournament open to all students. Prizes for top three finishers.',
    current_date - interval '2 days',
    '12:00', '18:00',
    'Student Union, Game Room',
    'Competition',
    32,
    'completed'
  ),
  (
    'Faculty Research Symposium',
    'Postponed due to venue scheduling conflict. A new date will be announced.',
    current_date + interval '21 days',
    '09:00', '17:00',
    'Science Building Atrium',
    'Academic',
    150,
    'cancelled'
  );
