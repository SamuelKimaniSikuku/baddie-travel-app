-- ═══════════════════════════════════════════════════════════════
-- BADDIE APP — Repair verifications → profiles foreign keys
-- Run AFTER 002. Idempotent — safe to run / re-run.
--
-- Symptom: the admin verification queue is empty and PostgREST reports
-- "Could not find a relationship between 'verifications' and 'profiles'".
-- Cause: the verifications table exists but its foreign keys to profiles
-- were never created (e.g. a pre-existing table made 002's
-- CREATE TABLE IF NOT EXISTS skip the fresh definition). Without the FKs,
-- the admin dashboard can't embed the submitter's profile.
--
-- This adds the two FKs (only if missing) with the exact names the app
-- embeds by, then reloads the PostgREST schema cache.
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- Submitter: verifications.user_id → profiles.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'verifications'
      AND constraint_name = 'verifications_user_id_fkey'
  ) THEN
    ALTER TABLE public.verifications
      ADD CONSTRAINT verifications_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- Reviewer: verifications.reviewer_id → profiles.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'verifications'
      AND constraint_name = 'verifications_reviewer_id_fkey'
  ) THEN
    ALTER TABLE public.verifications
      ADD CONSTRAINT verifications_reviewer_id_fkey
      FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id);
  END IF;
END $$;

-- Force PostgREST to pick up the new relationships immediately.
NOTIFY pgrst, 'reload schema';
