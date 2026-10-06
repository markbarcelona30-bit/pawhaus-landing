-- Standalone PostgreSQL schema. No dependency on Supabase's auth schema.
-- Apply with npm run db:migrate using DATABASE_URL_UNPOOLED.
CREATE SCHEMA IF NOT EXISTS pawhaus;
CREATE TABLE IF NOT EXISTS pawhaus.schema_migrations (
  version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pawhaus.staff (
  id uuid PRIMARY KEY, email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK(role IN ('ADMIN','FRONT_DESK','CARE_STAFF'))
);
CREATE TABLE IF NOT EXISTS pawhaus.sessions (
  token_hash text PRIMARY KEY, staff_id uuid NOT NULL REFERENCES pawhaus.staff(id) ON DELETE CASCADE,
  expires bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON pawhaus.sessions(expires);
CREATE TABLE IF NOT EXISTS pawhaus.room_inventory (
  id text PRIMARY KEY CHECK(id IN ('cozy','sunny','garden'))
);
INSERT INTO pawhaus.room_inventory(id) VALUES ('cozy'),('sunny'),('garden') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS pawhaus.bookings (
  id uuid PRIMARY KEY, request_key text UNIQUE NOT NULL,
  fingerprint text NOT NULL, data jsonb NOT NULL,
  room_id text NOT NULL REFERENCES pawhaus.room_inventory(id),
  check_in date NOT NULL, check_out date NOT NULL,
  status text NOT NULL CHECK(status IN ('PENDING','CONFIRMED','CHECKED_IN','CHECKED_OUT','CANCELLED','NO_SHOW')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(check_out > check_in AND check_out-check_in <= 30),
  CHECK(jsonb_typeof(data) = 'object'),
  CHECK(data->>'id' = id::text AND data->>'room' = room_id AND data->>'status' = status)
);
CREATE INDEX IF NOT EXISTS bookings_occupancy ON pawhaus.bookings(room_id,check_in,check_out)
  WHERE status IN ('PENDING','CONFIRMED','CHECKED_IN');
CREATE TABLE IF NOT EXISTS pawhaus.audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES pawhaus.bookings(id),
  actor text NOT NULL, action text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_booking ON pawhaus.audit(booking_id,id);
CREATE TABLE IF NOT EXISTS pawhaus.limits (
  key text PRIMARY KEY, count integer NOT NULL, expires bigint NOT NULL
);
REVOKE ALL ON SCHEMA pawhaus FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA pawhaus FROM PUBLIC;
INSERT INTO pawhaus.schema_migrations(version) VALUES (3) ON CONFLICT DO NOTHING;
