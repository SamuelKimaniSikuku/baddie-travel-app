-- ═══════════════════════════════════════════════════════════════
-- BADDIE APP — Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up all tables
-- ═══════════════════════════════════════════════════════════════

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- For location features

-- ═══════════════════════════════════════════
-- 1. PROFILES
-- ═══════════════════════════════════════════
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER CHECK (age >= 18 AND age <= 99),
  avatar TEXT DEFAULT '😎',
  avatar_url TEXT,  -- For uploaded photos
  bio TEXT,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  vibe TEXT CHECK (vibe IN ('Adventurous', 'Cultural', 'Social', 'Relaxed', 'Extreme', 'Creative')),
  budget TEXT CHECK (budget IN ('Budget', 'Mid-range', 'Luxury', 'Flexible')),
  interests TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{"English"}',
  verified BOOLEAN DEFAULT FALSE,
  trip_count INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0.0,
  online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 2. DESTINATIONS (current travel plans)
-- ═══════════════════════════════════════════
CREATE TABLE destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  destination_emoji TEXT DEFAULT '🌍',
  start_date DATE,
  end_date DATE,
  date_display TEXT,  -- "Mar 15 – Apr 2" for display
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_destinations_active ON destinations(is_active, destination);
CREATE INDEX idx_destinations_user ON destinations(user_id);

-- ═══════════════════════════════════════════
-- 3. MATCHES
-- ═══════════════════════════════════════════
CREATE TYPE swipe_action AS ENUM ('like', 'pass', 'super_like');

CREATE TABLE swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swiper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  swiped_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action swipe_action NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(swiper_id, swiped_id)
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shared_destination TEXT,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user1_id, user2_id)
);

CREATE INDEX idx_swipes_swiper ON swipes(swiper_id);
CREATE INDEX idx_swipes_swiped ON swipes(swiped_id);
CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);

-- ═══════════════════════════════════════════
-- 4. CONVERSATIONS & MESSAGES
-- ═══════════════════════════════════════════
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  is_group BOOLEAN DEFAULT FALSE,
  group_name TEXT,
  group_avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  muted BOOLEAN DEFAULT FALSE,
  UNIQUE(conversation_id, user_id)
);

CREATE TYPE message_type AS ENUM ('text', 'image', 'location', 'itinerary', 'expense', 'system');

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type message_type DEFAULT 'text',
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',  -- For location coords, image urls, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_conversation_members ON conversation_members(user_id);

-- ═══════════════════════════════════════════
-- 5. TRIPS & ITINERARIES
-- ═══════════════════════════════════════════
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  destination TEXT NOT NULL,
  destination_emoji TEXT DEFAULT '🌍',
  start_date DATE,
  end_date DATE,
  date_display TEXT,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'active', 'completed', 'cancelled')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trip_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('organizer', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

CREATE TABLE itinerary_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE itinerary_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_id UUID NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time TEXT,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  sort_order INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  added_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- 6. EXPENSES
-- ═══════════════════════════════════════════
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  paid_by UUID NOT NULL REFERENCES profiles(id),
  split_type TEXT DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom', 'full')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  settled BOOLEAN DEFAULT FALSE,
  UNIQUE(expense_id, user_id)
);

-- ═══════════════════════════════════════════
-- 7. STORIES
-- ═══════════════════════════════════════════
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image')),
  content TEXT NOT NULL,
  background_color TEXT DEFAULT '#FF5733',
  image_url TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stories_active ON stories(user_id, expires_at);

-- ═══════════════════════════════════════════
-- 8. NOTIFICATIONS
-- ═══════════════════════════════════════════
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'match', 'message', 'trip_update', 'expense'
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);

-- ═══════════════════════════════════════════
-- 9. REPORTS & BLOCKS (Safety)
-- ═══════════════════════════════════════════
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  reported_id UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read, only owner can update
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Destinations: Viewable by all, editable by owner
CREATE POLICY "Destinations are viewable" ON destinations FOR SELECT USING (true);
CREATE POLICY "Users manage own destinations" ON destinations FOR ALL USING (auth.uid() = user_id);

-- Swipes: Only swiper can see/create
CREATE POLICY "Users see own swipes" ON swipes FOR SELECT USING (auth.uid() = swiper_id);
CREATE POLICY "Users create own swipes" ON swipes FOR INSERT WITH CHECK (auth.uid() = swiper_id);

-- Matches: Both users can see their matches
CREATE POLICY "Users see own matches" ON matches FOR SELECT 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Conversations: Members only
CREATE POLICY "Members see conversations" ON conversations FOR SELECT 
  USING (id IN (SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()));

-- Messages: Conversation members only
CREATE POLICY "Members see messages" ON messages FOR SELECT 
  USING (conversation_id IN (SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid()));
CREATE POLICY "Members send messages" ON messages FOR INSERT 
  WITH CHECK (
    sender_id = auth.uid() AND 
    conversation_id IN (SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid())
  );

-- Conversation members
CREATE POLICY "Members see conversation members" ON conversation_members FOR SELECT 
  USING (conversation_id IN (SELECT conversation_id FROM conversation_members cm WHERE cm.user_id = auth.uid()));

-- Trips: Members only
CREATE POLICY "Trip members see trips" ON trips FOR SELECT 
  USING (id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()));
CREATE POLICY "Users create trips" ON trips FOR INSERT WITH CHECK (created_by = auth.uid());

-- Trip members
CREATE POLICY "See trip members" ON trip_members FOR SELECT 
  USING (trip_id IN (SELECT trip_id FROM trip_members tm WHERE tm.user_id = auth.uid()));

-- Itinerary: Trip members
CREATE POLICY "Trip members see itinerary days" ON itinerary_days FOR SELECT 
  USING (trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()));
CREATE POLICY "Trip members add itinerary days" ON itinerary_days FOR INSERT 
  WITH CHECK (trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()));

CREATE POLICY "Trip members see itinerary items" ON itinerary_items FOR SELECT 
  USING (day_id IN (SELECT id FROM itinerary_days WHERE trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())));
CREATE POLICY "Trip members add itinerary items" ON itinerary_items FOR INSERT 
  WITH CHECK (day_id IN (SELECT id FROM itinerary_days WHERE trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())));

-- Expenses: Trip members
CREATE POLICY "Trip members see expenses" ON expenses FOR SELECT 
  USING (trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()));
CREATE POLICY "Trip members add expenses" ON expenses FOR INSERT 
  WITH CHECK (trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid()));

CREATE POLICY "Users see own expense splits" ON expense_splits FOR SELECT 
  USING (user_id = auth.uid() OR expense_id IN (SELECT id FROM expenses WHERE paid_by = auth.uid()));

-- Stories: Public for active stories
CREATE POLICY "Active stories are viewable" ON stories FOR SELECT 
  USING (expires_at > NOW());
CREATE POLICY "Users manage own stories" ON stories FOR ALL USING (auth.uid() = user_id);

-- Notifications: Owner only
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Blocks
CREATE POLICY "Users manage own blocks" ON blocks FOR ALL USING (auth.uid() = blocker_id);

-- Reports
CREATE POLICY "Users create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ═══════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Traveler'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', '😎')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Check for mutual match and create match record
CREATE OR REPLACE FUNCTION check_mutual_match()
RETURNS TRIGGER AS $$
DECLARE
  mutual_swipe RECORD;
  new_match_id UUID;
  new_convo_id UUID;
  shared_dest TEXT;
BEGIN
  IF NEW.action = 'like' OR NEW.action = 'super_like' THEN
    -- Check if the other person already liked us
    SELECT * INTO mutual_swipe FROM swipes 
    WHERE swiper_id = NEW.swiped_id 
      AND swiped_id = NEW.swiper_id 
      AND action IN ('like', 'super_like');
    
    IF FOUND THEN
      -- Find shared destination
      SELECT d1.destination INTO shared_dest
      FROM destinations d1
      JOIN destinations d2 ON d1.destination = d2.destination
      WHERE d1.user_id = NEW.swiper_id 
        AND d2.user_id = NEW.swiped_id
        AND d1.is_active = true AND d2.is_active = true
      LIMIT 1;

      -- Create match
      INSERT INTO matches (user1_id, user2_id, shared_destination)
      VALUES (
        LEAST(NEW.swiper_id, NEW.swiped_id),
        GREATEST(NEW.swiper_id, NEW.swiped_id),
        shared_dest
      )
      ON CONFLICT (user1_id, user2_id) DO NOTHING
      RETURNING id INTO new_match_id;

      IF new_match_id IS NOT NULL THEN
        -- Create conversation
        INSERT INTO conversations (match_id)
        VALUES (new_match_id)
        RETURNING id INTO new_convo_id;

        -- Add both users to conversation
        INSERT INTO conversation_members (conversation_id, user_id)
        VALUES 
          (new_convo_id, NEW.swiper_id),
          (new_convo_id, NEW.swiped_id);

        -- System message
        INSERT INTO messages (conversation_id, type, content)
        VALUES (new_convo_id, 'system', 'You matched! Start planning your trip together ✈️');

        -- Notifications
        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES 
          (NEW.swiper_id, 'match', 'New Match! 🎉', 'You matched with someone heading to ' || COALESCE(shared_dest, 'the same place') || '!', jsonb_build_object('match_id', new_match_id)),
          (NEW.swiped_id, 'match', 'New Match! 🎉', 'You matched with someone heading to ' || COALESCE(shared_dest, 'the same place') || '!', jsonb_build_object('match_id', new_match_id));
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_swipe_check_match
  AFTER INSERT ON swipes
  FOR EACH ROW EXECUTE FUNCTION check_mutual_match();

-- Update conversation timestamp on new message
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  
  -- Create notification for other members
  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT cm.user_id, 'message', 
    (SELECT name FROM profiles WHERE id = NEW.sender_id),
    LEFT(NEW.content, 100),
    jsonb_build_object('conversation_id', NEW.conversation_id)
  FROM conversation_members cm
  WHERE cm.conversation_id = NEW.conversation_id
    AND cm.user_id != NEW.sender_id
    AND cm.muted = false;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- Update online status
CREATE OR REPLACE FUNCTION update_online_status(user_uuid UUID, is_online BOOLEAN)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET online = is_online, last_seen = NOW() WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════
-- REALTIME SUBSCRIPTIONS
-- ═══════════════════════════════════════════

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE stories;

-- ═══════════════════════════════════════════
-- STORAGE BUCKETS
-- ═══════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('stories', 'stories', true);

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT 
  USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Chat media accessible by conversation members" ON storage.objects FOR SELECT 
  USING (bucket_id = 'chat-media');
CREATE POLICY "Users can upload chat media" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'chat-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Story media is public" ON storage.objects FOR SELECT 
  USING (bucket_id = 'stories');
CREATE POLICY "Users can upload stories" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);
