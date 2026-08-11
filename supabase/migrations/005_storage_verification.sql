-- ═══════════════════════════════════════════════════════════════
-- BADDIE APP — Storage buckets for photos & identity documents
-- Run AFTER 002 (needs public.is_admin). Idempotent — safe to re-run.
--
-- Without these buckets the profile-photo upload and the identity
-- verification submission both fail at the storage step, so the whole
-- verification flow appears broken. ID documents live in a PRIVATE
-- bucket; only the owner and admins can read them (via signed URLs).
-- ═══════════════════════════════════════════════════════════════

-- Buckets ----------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('profile-photos', 'profile-photos', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('id-documents', 'id-documents', false)
  on conflict (id) do update set public = false;

-- profile-photos (public read; owner writes their own <uid>/ folder) --
DROP POLICY IF EXISTS "profile-photos owner write" ON storage.objects;
CREATE POLICY "profile-photos owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "profile-photos owner update" ON storage.objects;
CREATE POLICY "profile-photos owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "profile-photos owner delete" ON storage.objects;
CREATE POLICY "profile-photos owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "profile-photos public read" ON storage.objects;
CREATE POLICY "profile-photos public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

-- id-documents (private; owner writes their folder, owner+admin read) --
DROP POLICY IF EXISTS "id-documents owner write" ON storage.objects;
CREATE POLICY "id-documents owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'id-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "id-documents owner update" ON storage.objects;
CREATE POLICY "id-documents owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'id-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "id-documents owner or admin read" ON storage.objects;
CREATE POLICY "id-documents owner or admin read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'id-documents'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin(auth.uid()))
  );
