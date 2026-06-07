-- ═══════════════════════════════════════════════════════════════
-- BADDIE APP — Verification Security, Admin Roles & Feature Columns
-- Run this AFTER 001_schema.sql. Safe to run (and re-run) on an
-- existing database — every statement is idempotent.
--
-- Problem: the "Users can update own profile" policy grants UPDATE on
-- ALL columns of a user's own row, so any user could self-award the
-- trust badge with one API call:
--     update profiles set verified = true where id = auth.uid();
--
-- Fix: reputation columns (`verified`, `rating`) and the admin flag
-- (`is_admin`) can only be set by the backend (service role) or by a
-- designated admin acting through the admin dashboard. Normal clients
-- can still edit their own name/bio/photos/notification prefs/etc.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Feature columns referenced by the app ────────────────────
-- Verification flow (src/components/PhotoVerification.jsx)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verify_status TEXT
  DEFAULT 'unverified'
  CHECK (verify_status IN ('unverified', 'pending', 'verified', 'rejected'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verify_submitted_at TIMESTAMPTZ;

-- Admin + moderation (src/components/AdminDashboard.jsx)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE;

-- Premium plan (src/components/PremiumFeatures.jsx)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free'
  CHECK (plan IN ('free', 'plus', 'pro'));

-- Notification preferences (src/components/PremiumFeatures.jsx)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notif_matches   BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notif_messages  BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notif_trips     BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notif_marketing BOOLEAN DEFAULT FALSE;

-- ─── 2. Admin check helper (SECURITY DEFINER avoids RLS recursion) ─
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM profiles WHERE id = uid), FALSE);
$$;

-- ─── 3. Freeze reputation/admin columns for non-privileged callers ─
-- BEFORE UPDATE trigger: resets protected columns to their stored
-- values unless the request comes from the service role, a superuser
-- (SQL editor), or a designated admin. Belt-and-suspenders with RLS —
-- even a fully compromised browser key cannot flip `verified`.
CREATE OR REPLACE FUNCTION protect_profile_reputation_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Backend (service role) and direct SQL (postgres) may set anything.
  IF auth.role() = 'service_role' OR session_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- `is_admin` is NEVER client-settable (no privilege escalation, even
  -- by existing admins). Promote admins only via the backend / SQL.
  NEW.is_admin := OLD.is_admin;

  -- Designated admins (acting through the admin dashboard) may set the
  -- reputation fields below — that's how verification approval works.
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Everyone else: keep server-controlled fields at their stored values.
  NEW.verified := OLD.verified;
  NEW.rating   := OLD.rating;
  -- A client may move itself to 'pending' (on submit) but must never
  -- self-promote to 'verified'. Collapse any such attempt back.
  IF NEW.verify_status = 'verified' AND OLD.verify_status IS DISTINCT FROM 'verified' THEN
    NEW.verify_status := OLD.verify_status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_reputation_fields ON profiles;
CREATE TRIGGER trg_protect_profile_reputation_fields
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_reputation_fields();

-- ─── 4. Admins may update any profile (for ban / verify badge) ────
DROP POLICY IF EXISTS "Admins update any profile" ON profiles;
CREATE POLICY "Admins update any profile" ON profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- ─── 5. Verification submissions review table ─────────────────────
CREATE TABLE IF NOT EXISTS verifications (
  user_id      UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  doc_type     TEXT NOT NULL CHECK (doc_type IN ('passport', 'id_card', 'drivers_license')),
  front_path   TEXT NOT NULL,
  back_path    TEXT,
  selfie_path  TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id  UUID REFERENCES profiles(id),
  review_note  TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at  TIMESTAMPTZ
);

ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Owner can see / submit / re-submit their own documents.
DROP POLICY IF EXISTS "Users see own verification" ON verifications;
CREATE POLICY "Users see own verification" ON verifications FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users submit own verification" ON verifications;
CREATE POLICY "Users submit own verification" ON verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own pending verification" ON verifications;
CREATE POLICY "Users update own pending verification" ON verifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins review submissions (approve/reject).
DROP POLICY IF EXISTS "Admins review verifications" ON verifications;
CREATE POLICY "Admins review verifications" ON verifications FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- ─── 6. Premium subscriptions (src/components/PremiumFeatures.jsx) ─
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id              UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  plan                 TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'plus', 'pro')),
  status               TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own subscription" ON subscriptions;
CREATE POLICY "Users see own subscription" ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own subscription" ON subscriptions;
CREATE POLICY "Users manage own subscription" ON subscriptions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- NOTE: in production the plan should be set by a trusted Stripe webhook
-- (service role), not the client. This client-writable policy matches the
-- current demo "simulated upgrade" flow and should be tightened before
-- real billing goes live.

-- ─── 7. Seed admins ──────────────────────────────────────────────
-- EDIT this list to match the real admin account(s). Runs as postgres,
-- so it bypasses the reputation trigger above.
UPDATE profiles SET is_admin = TRUE
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN (
    'samuel.kimani.sikuku@gmail.com',
    'samuelkimani@gmail.com',
    'explorer@baddie.app'
  )
);

-- ─── Reference: how approval works ───────────────────────────────
-- When an admin clicks "Approve" in /admin, the dashboard (running as
-- that authenticated admin) runs, and both UPDATEs succeed because the
-- caller passes public.is_admin():
--     update verifications set status='approved', reviewed_at=now(),
--            reviewer_id=<admin>, review_note=<note> where user_id=<uid>;
--     update profiles set verified=true, verify_status='verified'
--      where id=<uid>;
-- A normal user attempting the second UPDATE is silently no-op'd by the
-- trigger (verified stays at its stored value).
