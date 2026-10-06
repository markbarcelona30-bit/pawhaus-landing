# Booking backend — first working slice

This implements the overnight booking core in the build plan without rewriting the marketing site. The user selected a local build before connecting Supabase. The runtime is Node 24 + SQLite; the backend is strictly typed and the public/admin clients use same-origin JSON APIs.

## HTTP contract

| Method | Route | Access | Result |
| --- | --- | --- | --- |
| GET | `/api/config` | Public | Local mode, room rates/capacities, business date |
| GET | `/api/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&guests=1` | Public | Available rooms and server-calculated totals |
| POST | `/api/bookings` | Public, consent required | Reference, status, total, nights; no private guest data returned |
| POST | `/api/auth/login` | Email/password | Staff role + session cookie |
| POST | `/api/auth/logout` | Session | Revoked cookie/session |
| GET | `/api/auth/session` | Staff | Staff identity and role |
| GET | `/api/admin/bookings` | Staff | Booking snapshots |
| GET | `/api/admin/bookings/:id/history` | Staff | Audit history |
| PATCH | `/api/admin/bookings/:id` | Admin/front desk | Updated booking snapshot |

POST `/api/bookings` requires `Idempotency-Key` (16–100 alphanumeric/hyphen/underscore characters). Body:

```json
{
  "checkIn": "2027-01-10", "checkOut": "2027-01-12",
  "room": "cozy", "guests": 1,
  "dogName": "Milo", "sibling": "", "breed": "Corgi", "size": "small",
  "owner": "Example Guest", "email": "guest@example.com", "phone": "",
  "notes": "Usual food and quiet play", "consent": true
}
```

PATCH body is `{ "status": "CONFIRMED", "version": 1 }`. A stale version returns 409. Validation failures are 400; unauthenticated access 401; unauthorized role/origin 403; full rooms and invalid transitions 409; rate limiting 429. Client errors are shown without losing the entered form details. No endpoints allow staff self-registration.

## Integrity and persistence

`BEGIN IMMEDIATE` serializes local inventory mutations. Occupancy is the maximum number of active bookings on any night in the requested interval, not the sum of every overlapping booking. Arrival is inclusive and departure exclusive. PENDING holds inventory; explicit staff cancellation releases it. Requests do not expire automatically in this slice.

Customer/dog information is stored as a booking snapshot. Guest lists are derived from these snapshots by email. There is no separate editable customer/pet profile yet. This preserves each request's original details. Activity records capture the actor and every status change. No payment status is inferred from a booking confirmation.

The local database, session tokens, generated credential files, server logs, and browser test data are ignored by Git and excluded from static builds. Staff passwords are stored as scrypt hashes. No secrets are embedded in either browser script. Staff routes authorize the actual session on every request. The local server only serves `public`, `src/css`, and `src/js` assets.

## Supabase connection phase

`migrations/002-supabase-core.sql` is a versioned **schema foundation**, not a connected production backend. It provides staff profiles linked to Supabase Auth, room types, booking snapshots, idempotency keys, and audit records. RLS denies anonymous/browser access to bookings. It has not been applied to a live project.

When the project is available:

1. Apply and verify the SQL in a staging Supabase project. Set actual room capacities/rates.
2. Replace local `Store` with a PostgreSQL/Supabase adapter behind the same API contract. Move capacity checks and inserts into one database transaction/RPC; lock the room type before calculating per-night occupancy. A REST read followed by a separate insert is unsafe.
3. Authenticate staff with Supabase Auth; verify the access token server-side and read the staff role from `staff_profiles`. Provision staff accounts administratively. Replace local scrypt accounts/sessions; do not migrate their password hashes to Auth.
4. Add Vercel API functions. Keep the Supabase server secret exclusively in server environment variables. Never ship it in browser scripts or static output.
5. Use durable production rate limits, HTTPS Secure cookies, audit attribution, database backups, and production error monitoring. Add an expiration policy for pending requests and a staff recovery/password-reset flow.
6. Export local booking snapshots for deliberate import if needed, preserving references and historical totals. Map customer/pet entities when introducing editable profiles.
7. Repeat the existing HTTP tests against staging, including parallel requests competing for the last room, logout, role revocation, and cross-origin rejection. Then deploy and verify the public request → staff confirmation flow.

The website stays in demo mode on Vercel until a configured production backend explicitly enables saved requests. Do not use Vercel's ephemeral filesystem as a persistent SQLite booking database.

## Scope after this slice

The plan's customer portal, payments/refunds, notifications, CMS, grooming/daycare service scheduling, room maintenance, rescheduling, and advanced reports remain future work. The implemented portal intentionally exposes only functioning features.
