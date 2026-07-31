-- ═══════════════════════════════════════════════════════════════
-- BADDIE APP — Trip flights
-- Stores flights a member saves to a trip (from the flight search).
-- Run AFTER 001_schema.sql. Idempotent — safe to run / re-run.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS trip_flights (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id              uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  airline              text,
  flight_number        text,
  from_code            text,
  to_code              text,
  from_city            text,
  to_city              text,
  depart_time          text,
  arrive_time          text,
  depart_date          text,
  duration             text,
  stops                integer,
  price                numeric,
  currency             text DEFAULT 'USD',
  round_trip           boolean DEFAULT false,
  return_flight_number text,
  return_depart_time   text,
  return_arrive_time   text,
  return_date          text,
  return_duration      text,
  return_stops         integer,
  status               text DEFAULT 'saved',
  added_by             uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trip_flights_trip_id_idx ON trip_flights(trip_id);

ALTER TABLE trip_flights ENABLE ROW LEVEL SECURITY;

-- Membership predicate reused by every policy: the current user must be
-- a member of the trip the flight belongs to.
DROP POLICY IF EXISTS "Trip members read flights" ON trip_flights;
CREATE POLICY "Trip members read flights" ON trip_flights FOR SELECT
  USING (trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Trip members add flights" ON trip_flights;
CREATE POLICY "Trip members add flights" ON trip_flights FOR INSERT
  WITH CHECK (trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Trip members delete flights" ON trip_flights;
CREATE POLICY "Trip members delete flights" ON trip_flights FOR DELETE
  USING (trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()));
