-- ═══════════════════════════════════════════════════════════════
-- BADDIE APP — Fix infinite recursion in trip_members RLS
-- Run AFTER 001. Idempotent — safe to run / re-run.
--
-- Symptom: any trips / trip_members query fails with
--   "infinite recursion detected in policy for relation trip_members" (42P17)
-- so the whole Trips feature (and the trip reminders) is broken live.
--
-- Cause: the "See trip members" policy SELECTs from trip_members inside
-- its own USING clause, so evaluating it re-triggers itself forever.
--
-- Fix: a SECURITY DEFINER helper that reads trip_members with RLS
-- bypassed (runs as owner), so membership checks don't recurse.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_trip_member(p_trip_id uuid, p_user uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_id = p_trip_id AND user_id = p_user
  );
$$;

-- Members of a trip can see all member rows of that trip — without the
-- self-referential subquery that caused the recursion.
DROP POLICY IF EXISTS "See trip members" ON trip_members;
CREATE POLICY "See trip members" ON trip_members FOR SELECT
  USING (user_id = auth.uid() OR public.is_trip_member(trip_id, auth.uid()));

-- Same treatment for the trips SELECT policy (was querying trip_members
-- directly; use the helper so it can never recurse).
DROP POLICY IF EXISTS "Trip members see trips" ON trips;
CREATE POLICY "Trip members see trips" ON trips FOR SELECT
  USING (created_by = auth.uid() OR public.is_trip_member(id, auth.uid()));

NOTIFY pgrst, 'reload schema';
