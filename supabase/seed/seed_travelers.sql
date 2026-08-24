-- ═══════════════════════════════════════════════════════════════
-- BADDIE — Seed travelers (cold-start fix)
-- Run in the Supabase SQL editor. Idempotent — safe to re-run.
--
-- Discovery only shows profiles that have an ACTIVE destinations row,
-- and profiles.id must reference auth.users. So each seed:
--   1. creates a confirmed auth user with a random unguessable password
--      (these accounts can never be logged into),
--   2. lets the handle_new_user trigger create the profile,
--   3. enriches the profile (bio, city, vibe, budget, interests, age),
--   4. adds an active destination so they appear in Discover.
--
-- To remove all seeds later:
--   DELETE FROM auth.users WHERE email LIKE '%@seed.baddie.app';
-- (profiles + destinations cascade.)
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  seed RECORD;
  uid uuid;
BEGIN
  FOR seed IN
    SELECT * FROM (VALUES
      ('amara@seed.baddie.app',  'Amara',  '👩🏾', 27, 'Nairobi',    'Safari guide turned digital nomad. I plan trips like military ops but laugh through all of them.', 'Adventurous', 'Mid-range', ARRAY['Hiking','Wildlife','Photography','Camping'],  'Zanzibar',  '🏝️', 'Sep 5 – Sep 18',  DATE '2026-09-05', DATE '2026-09-18'),
      ('kofi@seed.baddie.app',   'Kofi',   '👨🏾', 31, 'Accra',      'Street-food hunter. If there''s a market, I''m in it. Looking for a crew for East Africa.',        'Social',      'Budget',    ARRAY['Food','Markets','Music','Nightlife'],          'Nairobi',   '🦁', 'Sep 10 – Sep 24', DATE '2026-09-10', DATE '2026-09-24'),
      ('lena@seed.baddie.app',   'Lena',   '👩🏻', 29, 'Berlin',     'Architect who books flights before hotels. Chasing tilework and good coffee.',                    'Cultural',    'Mid-range', ARRAY['Architecture','Art','Coffee','History'],       'Marrakesh', '🕌', 'Sep 12 – Sep 22', DATE '2026-09-12', DATE '2026-09-22'),
      ('diego@seed.baddie.app',  'Diego',  '👨🏽', 33, 'Mexico City','Surf mornings, taco evenings. Fluent in Spanish, English and bad jokes.',                        'Relaxed',     'Budget',    ARRAY['Surfing','Beaches','Food','Music'],            'Bali',      '🏄', 'Oct 1 – Oct 21',  DATE '2026-10-01', DATE '2026-10-21'),
      ('yuki@seed.baddie.app',   'Yuki',   '👩🏻', 26, 'Osaka',      'Trail runner and onsen enthusiast. I travel light and walk far.',                                 'Extreme',     'Mid-range', ARRAY['Hiking','Mountains','Trekking','Photography'], 'Cape Town', '⛰️', 'Sep 20 – Oct 4',  DATE '2026-09-20', DATE '2026-10-04'),
      ('tunde@seed.baddie.app',  'Tunde',  '👨🏾', 35, 'Lagos',      'Afrobeats, rooftops and long dinners. Business class taste, exit row budget.',                   'Luxury',      'Flexible',  ARRAY['Nightlife','Food','Music','Sailing'],          'Lisbon',    '🌉', 'Sep 8 – Sep 16',  DATE '2026-09-08', DATE '2026-09-16'),
      ('sofia@seed.baddie.app',  'Sofia',  '👩🏽', 30, 'Barcelona',  'Yoga teacher collecting sunrises. Slow travel only — quality over checklist.',                    'Relaxed',     'Budget',    ARRAY['Yoga','Beaches','Markets','Art'],              'Bali',      '🌺', 'Sep 25 – Oct 20', DATE '2026-09-25', DATE '2026-10-20'),
      ('marcus@seed.baddie.app', 'Marcus', '👨🏽', 28, 'London',     'History nerd with a drone. I''ll find the viewpoint, you bring the playlist.',                    'Creative',    'Mid-range', ARRAY['Photography','History','Coffee','Motorbikes'], 'Tokyo',     '⛩️', 'Oct 5 – Oct 19',  DATE '2026-10-05', DATE '2026-10-19'),
      ('naledi@seed.baddie.app', 'Naledi', '👩🏾', 24, 'Johannesburg','Marine bio student. Happiest 18 metres under. Dive buddies wanted.',                             'Adventurous', 'Budget',    ARRAY['Diving','Beaches','Wildlife','Camping'],       'Zanzibar',  '🐠', 'Sep 3 – Sep 15',  DATE '2026-09-03', DATE '2026-09-15'),
      ('elias@seed.baddie.app',  'Elias',  '🧔',   32, 'Stockholm',  'Chef off-duty. I travel to eat and cook what I learn. Street stalls > starred menus.',            'Cultural',    'Flexible',  ARRAY['Food','Markets','Coffee','Sailing'],           'Bangkok',   '🍜', 'Sep 15 – Sep 29', DATE '2026-09-15', DATE '2026-09-29')
    ) AS t(email, name, avatar, age, city, bio, vibe, budget, interests, dest, dest_emoji, date_display, start_d, end_d)
  LOOP
    -- Skip if this seed already exists.
    SELECT id INTO uid FROM auth.users WHERE email = seed.email;
    IF uid IS NULL THEN
      uid := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
        seed.email, crypt(gen_random_uuid()::text, gen_salt('bf')),
        now(), '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('name', seed.name, 'avatar', seed.avatar),
        now(), now()
      );
      -- handle_new_user trigger has now created the profiles row.
    END IF;

    UPDATE public.profiles SET
      age = seed.age, city = seed.city, bio = seed.bio,
      vibe = seed.vibe, budget = seed.budget, interests = seed.interests,
      online = false, last_seen = now() - (random() * interval '6 hours')
    WHERE id = uid;

    IF NOT EXISTS (SELECT 1 FROM public.destinations WHERE user_id = uid AND is_active) THEN
      INSERT INTO public.destinations (user_id, destination, destination_emoji, start_date, end_date, date_display, is_active)
      VALUES (uid, seed.dest, seed.dest_emoji, seed.start_d, seed.end_d, seed.date_display, true);
    END IF;
  END LOOP;
END $$;

-- Sanity check: how many seed travelers are discoverable?
SELECT p.name, p.city, d.destination, d.date_display
FROM public.profiles p
JOIN public.destinations d ON d.user_id = p.id AND d.is_active
JOIN auth.users u ON u.id = p.id
WHERE u.email LIKE '%@seed.baddie.app'
ORDER BY p.name;
