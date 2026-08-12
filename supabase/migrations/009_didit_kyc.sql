-- ═══════════════════════════════════════════════════════════════
-- BADDIE APP — Didit automated KYC (mirrors the Kifurushi flow)
-- Run AFTER 002 (needs profiles.verified + profiles.is_admin).
-- Idempotent — safe to run / re-run.
--
-- A fresh table (kyc_verifications) drives the automated flow, kept
-- separate from the legacy manual `verifications` table so the two
-- don't collide. Rows are created ONLY by the didit-session edge
-- function (service role) when it opens a hosted Didit session, and
-- resolved ONLY by the didit-webhook function when Didit decides.
-- Clients can read their own row but never write — the function is the
-- only door, so a row always corresponds to a real provider session.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider      text NOT NULL DEFAULT 'didit',
  provider_ref  text,                       -- Didit session_id
  id_type       text NOT NULL CHECK (id_type IN ('passport','national_id','drivers_licence')),
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','in_review','verified','rejected')),
  decline_reason text,                      -- machine-readable, e.g. duplicate_account
  created_at    timestamptz NOT NULL DEFAULT now(),
  resolved_at   timestamptz
);

CREATE INDEX IF NOT EXISTS kyc_verifications_user_idx ON public.kyc_verifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS kyc_verifications_ref_idx  ON public.kyc_verifications(provider_ref);

ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Users may read their own verification state; nobody writes from the client.
DROP POLICY IF EXISTS "read own kyc" ON public.kyc_verifications;
CREATE POLICY "read own kyc" ON public.kyc_verifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE ON public.kyc_verifications FROM authenticated, anon;

-- Reuse the existing admin flag (profiles.is_admin, seeded in 002) for the
-- review queue — no separate admins table needed here.

NOTIFY pgrst, 'reload schema';
