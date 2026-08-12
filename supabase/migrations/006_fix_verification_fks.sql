-- ═══════════════════════════════════════════════════════════════
-- BADDIE APP — Align legacy verifications table + repair FKs
-- Run AFTER 002. Idempotent — safe to run / re-run.
--
-- The live verifications table is an OLDER version: it has user_id,
-- doc_type, front/back/selfie_path, status, submitted_at, reviewed_at,
-- id and `notes`, but is MISSING reviewer_id and review_note, and may
-- lack a UNIQUE(user_id) constraint and the FKs to profiles. Because it
-- already existed, 002's CREATE TABLE IF NOT EXISTS skipped it.
--
-- This brings the table up to the schema the app expects, then adds the
-- foreign keys the admin dashboard embeds by.
-- ═══════════════════════════════════════════════════════════════

-- 1. Missing columns -------------------------------------------------
ALTER TABLE public.verifications ADD COLUMN IF NOT EXISTS reviewer_id uuid;
ALTER TABLE public.verifications ADD COLUMN IF NOT EXISTS review_note text;

-- Carry any legacy `notes` into review_note (one-time, where empty).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'verifications' AND column_name = 'notes'
  ) THEN
    UPDATE public.verifications SET review_note = notes
      WHERE review_note IS NULL AND notes IS NOT NULL;
  END IF;
END $$;

-- 2. UNIQUE(user_id) so the submission upsert (onConflict user_id) works
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'verifications_user_id_key' AND conrelid = 'public.verifications'::regclass
  ) THEN
    ALTER TABLE public.verifications ADD CONSTRAINT verifications_user_id_key UNIQUE (user_id);
  END IF;
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'verifications.user_id has duplicate values; UNIQUE not added — deduplicate then re-run.';
END $$;

-- 3. Foreign keys to profiles (the admin queue embeds by these) -------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='verifications'
      AND constraint_name='verifications_user_id_fkey'
  ) THEN
    ALTER TABLE public.verifications
      ADD CONSTRAINT verifications_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='verifications'
      AND constraint_name='verifications_reviewer_id_fkey'
  ) THEN
    ALTER TABLE public.verifications
      ADD CONSTRAINT verifications_reviewer_id_fkey
      FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
