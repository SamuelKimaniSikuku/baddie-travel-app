-- ═══════════════════════════════════════════════════════════════
-- BADDIE APP — Point verifications FKs at profiles (not auth.users)
-- Run AFTER 006. Idempotent — safe to run / re-run.
--
-- The legacy table already had a constraint named
-- verifications_user_id_fkey, but it references auth.users, so 006's
-- name-based guard skipped adding the profiles FK. PostgREST can only
-- embed profiles when the FK actually targets profiles. This drops any
-- verifications FK that doesn't point to public.profiles, then adds the
-- profiles-targeting FKs. (profiles.id itself references auth.users, so
-- integrity to the auth user is preserved transitively.)
-- ═══════════════════════════════════════════════════════════════

-- 1. Drop FKs on verifications that reference anything other than profiles.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = rel.relnamespace
    WHERE con.contype = 'f'
      AND ns.nspname = 'public'
      AND rel.relname = 'verifications'
      AND con.confrelid <> 'public.profiles'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.verifications DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- 2. Add profiles-targeting FKs if not already present (checked by target,
--    not just by name).
DO $$
DECLARE
  user_attnum     smallint := (SELECT attnum FROM pg_attribute WHERE attrelid='public.verifications'::regclass AND attname='user_id');
  reviewer_attnum smallint := (SELECT attnum FROM pg_attribute WHERE attrelid='public.verifications'::regclass AND attname='reviewer_id');
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.verifications'::regclass AND contype='f'
      AND confrelid='public.profiles'::regclass AND conkey = ARRAY[user_attnum]
  ) THEN
    ALTER TABLE public.verifications ADD CONSTRAINT verifications_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.verifications'::regclass AND contype='f'
      AND confrelid='public.profiles'::regclass AND conkey = ARRAY[reviewer_attnum]
  ) THEN
    ALTER TABLE public.verifications ADD CONSTRAINT verifications_reviewer_id_fkey
      FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
