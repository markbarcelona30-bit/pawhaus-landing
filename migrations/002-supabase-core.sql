-- PostgreSQL/Supabase schema foundation for the NEXT connection phase.
-- This file is NOT used by the local SQLite runtime. Review/apply in staging.
-- Capacity reservation must be implemented as a transactional RPC in the adapter;
-- these tables alone do not make read-then-insert reservations safe.
begin;
create table public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check(role in ('ADMIN','FRONT_DESK','CARE_STAFF')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.room_types (
  id text primary key check(id in ('cozy','sunny','garden')),
  name text not null,
  nightly_rate integer not null check(nightly_rate > 0),
  capacity integer not null check(capacity >= 0),
  max_dogs integer not null check(max_dogs between 1 and 2)
);
insert into public.room_types values
  ('cozy','Cozy Nook',1200,4,1),
  ('sunny','Sunny Suite',1800,3,1),
  ('garden','Garden Hangout',2600,2,2);
create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  request_key text not null unique check(length(request_key) between 16 and 100),
  fingerprint jsonb not null,
  room_id text not null references public.room_types(id),
  check_in date not null,
  check_out date not null,
  guests integer not null check(guests between 1 and 2),
  nights integer generated always as (check_out - check_in) stored,
  total integer not null check(total > 0),
  status text not null default 'PENDING' check(status in ('PENDING','CONFIRMED','CHECKED_IN','CHECKED_OUT','CANCELLED','NO_SHOW')),
  guest_details jsonb not null check(jsonb_typeof(guest_details) = 'object'),
  consent_at timestamptz not null,
  version integer not null default 1 check(version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(check_out > check_in and check_out - check_in <= 30)
);
create index booking_requests_active_dates on public.booking_requests(room_id,check_in,check_out)
  where status in ('PENDING','CONFIRMED','CHECKED_IN');
create table public.booking_audit (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.booking_requests(id),
  staff_id uuid references public.staff_profiles(id) on delete set null,
  actor text not null,
  action text not null,
  created_at timestamptz not null default now()
);
alter table public.staff_profiles enable row level security;
alter table public.room_types enable row level security;
alter table public.booking_requests enable row level security;
alter table public.booking_audit enable row level security;
-- No browser policies: all guest/staff booking access goes through authorized APIs.
revoke all on public.staff_profiles, public.room_types, public.booking_requests, public.booking_audit from anon, authenticated;
grant select, insert, update on public.staff_profiles, public.room_types, public.booking_requests, public.booking_audit to service_role;
grant usage, select on sequence public.booking_audit_id_seq to service_role;
commit;
