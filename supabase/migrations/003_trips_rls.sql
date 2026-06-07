-- ═══════════════════════════════════════════════════════════════
-- BADDIE APP — Trips RLS fixes
-- Run AFTER 001_schema.sql. Idempotent — safe to run / re-run.
--
-- 001_schema.sql enabled RLS on trip_members and itinerary_items but
-- only created SELECT (and itinerary INSERT) policies. Without the
-- policies below, two core actions are silently denied:
--   • Adding yourself as a member when creating a trip  → trip is
--     invisible (getTrips() reads through trip_members).
--   • Ticking a checklist item complete                 → UPDATE blocked.
-- ═══════════════════════════════════════════════════════════════

-- Allow a user to add themselves to a trip, and allow a trip's creator
-- to add other members (e.g. a matched travel buddy).
DROP POLICY IF EXISTS "Users add trip members" ON trip_members;
CREATE POLICY "Users add trip members" ON trip_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
  );

-- Allow trip members to tick itinerary items complete / edit them.
DROP POLICY IF EXISTS "Trip members update itinerary items" ON itinerary_items;
CREATE POLICY "Trip members update itinerary items" ON itinerary_items FOR UPDATE
  USING (
    day_id IN (
      SELECT id FROM itinerary_days
      WHERE trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
    )
  );

-- Allow trip members to update trip details (e.g. status planning→confirmed).
DROP POLICY IF EXISTS "Trip members update trips" ON trips;
CREATE POLICY "Trip members update trips" ON trips FOR UPDATE
  USING (id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()));
