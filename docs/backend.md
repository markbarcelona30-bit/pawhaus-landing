# Booking backend — first working slice

This implements the overnight booking core in the build plan without rewriting the marketing site. The runtime is Node 24 with PostgreSQL on Neon when DATABASE_URL is configured, or SQLite for offline development; the backend is strictly typed and the public/admin clients use same-origin JSON APIs.

## HTTP contract

| Method | Route | Access | Result |
| --- | --- | --- | --- |
| GET | `/api/config` | Public | Storage mode, room rates/capacities, business date |
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

## Neon database

The configured project is Pawhaus (`frosty-glitter-18857852`), PostgreSQL 17 in AWS Singapore. The local application uses the `local` branch and `pawhaus_local` database. The separate `pawhaus_test` database contains only fictional integration test data. Vercel uses the separate `pawhaus_production` database on the same `local` branch/compute; runtime permissions are restricted to the booking schema. The `production` branch remains unused. The initial `development` branch is unused.

Copy `.env.example` to `.env` for another checkout and supply a pooled `DATABASE_URL` and direct `DATABASE_URL_UNPOOLED` from Neon. Credentials must stay in ignored environment files or server environment variables. TLS verifies the server certificate. `npm run db:migrate` applies `migrations/003-neon.sql` transactionally over the direct connection. `npm run db:import-local` imports staff hashes, bookings and audit records into an empty target while preserving SQLite. It does not transfer existing sessions; sign in again.

The PostgreSQL adapter locks the room inventory row before measuring occupancy and inserting a request. An additional transaction lock protects retry keys across room choices. Booking status updates lock the booking row and retain version checks. Sessions are hashed in storage, passwords remain salted scrypt hashes, and rate limits are durable PostgreSQL records. The existing staff API and roles are preserved.

`npm test` runs the offline tests. To run `tests/postgres.test.ts`, set TEST_DATABASE_URL to a dedicated database whose name ends in `_test`, then run `node --test tests/postgres.test.ts`. This suite applies the schema, verifies concurrent capacity, retry protection, staff login/logout, authorization, version conflicts, cancellation and persistence, and removes its fictional staff/bookings. Never point it at the live booking database.

Vercel now serves the same API through `api/index.ts`. Rewrites preserve API paths and query parameters, and the static landing page/admin assets remain in `dist`. The function runs in Singapore on Node 24 with Fluid Compute and managed idle database connections. Vercel stores only the runtime DATABASE_URL as a sensitive production variable; the migration owner connection stays in ignored `.env.production.local`. Preview deployments do not receive production credentials and return 503 until configured separately. Production startup refuses to fall back to SQLite when DATABASE_URL is absent. Set actual inventory and rates before taking real guests; payments, emails and password recovery remain separate work. The older Supabase migration is retained as a historical alternative and is not used by this adapter.

## Scope after this slice

The plan's customer portal, payments/refunds, notifications, CMS, grooming/daycare service scheduling, room maintenance, rescheduling, and advanced reports remain future work. The implemented portal intentionally exposes only functioning features.

## Production operations

The public site is https://pawhaus-hotel.vercel.app and staff access is /admin. The existing staff login is preserved; sessions are separate from local development. Run migrations or create staff against production with Node's --env-file=.env.production.local option, for example: node --env-file=.env.production.local scripts/db-migrate.ts. Keep this file private. Database setup and the full deployed HTTP workflow were verified with a fictional booking; that record was removed after cancellation. CLI deployments can be verified with vercel curl without disabling deployment protection. Future Git deployments must retain the API entry point, rewrites and server-only environment configuration.
