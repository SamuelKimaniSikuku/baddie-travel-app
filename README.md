# ✈️ Baddie — Travel Together

> A travel companion matching & messaging app. Swipe to find travel buddies heading to the same destinations, chat in real-time, plan itineraries together, and split expenses.

## 🏗️ Architecture

```
baddie-project/
├── supabase/
│   └── migrations/
│       └── 001_schema.sql          # Complete database schema
├── src/
│   ├── lib/
│   │   └── supabase.js             # Supabase client config
│   ├── services/
│   │   ├── auth.js                 # Auth (email, OAuth, sessions)
│   │   ├── profiles.js             # User profiles & discovery
│   │   ├── matching.js             # Swipes & match detection
│   │   ├── messaging.js            # Real-time chat (Supabase Realtime)
│   │   ├── trips.js                # Trip management & itineraries
│   │   └── expenses.js             # Expense tracking & splitting
│   ├── hooks/
│   │   └── useSupabase.js          # React hooks for all services
│   └── components/                 # React UI components (from v2)
├── .env.example
├── package.json
└── README.md
```

## 🚀 Setup Guide

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings → API

### 2. Run Database Migration

Open the **SQL Editor** in your Supabase dashboard and paste the contents of `supabase/migrations/001_schema.sql`. This creates:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles with travel preferences |
| `destinations` | Where each user wants to travel |
| `swipes` | Like/pass actions |
| `matches` | Mutual matches (auto-created by trigger) |
| `conversations` | Chat threads (1:1 and group) |
| `conversation_members` | Who's in each conversation |
| `messages` | Chat messages with types (text, image, location) |
| `trips` | Trip records |
| `trip_members` | Who's on each trip |
| `itinerary_days` | Day-by-day planning |
| `itinerary_items` | Activities within each day |
| `expenses` | Trip expenses |
| `expense_splits` | How expenses are split |
| `stories` | 24-hour travel stories |
| `notifications` | Push notification records |
| `blocks` / `reports` | Safety features |

The migration also sets up:
- **Row Level Security (RLS)** — Users can only access their own data
- **Triggers** — Auto-create profile on signup, auto-detect mutual matches, auto-create conversations
- **Realtime** — Messages, matches, and notifications publish to Supabase Realtime
- **Storage Buckets** — Avatars, chat media, and story images

### 3. Configure Auth Providers

In your Supabase dashboard → Authentication → Providers:

- **Email** — Enabled by default
- **Google** — Add your Google OAuth credentials
- **Apple** — Add your Apple Sign-in credentials

### 4. Install & Run

```bash
# Clone and install
cd baddie-project
npm install

# Set up environment
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# Start dev server
npm run dev
```

### 5. Enable Realtime

In your Supabase dashboard → Database → Replication, enable realtime for:
- `messages`
- `matches`
- `notifications`
- `conversations`
- `stories`

(The migration attempts this automatically, but verify in the dashboard)

## 🔌 Service Layer API

### Auth Service
```javascript
import { authService } from './services/auth';

// Sign up
await authService.signUp({ email, password, name: 'Sofia', avatar: '🧕' });

// Sign in
await authService.signIn({ email, password });

// OAuth
await authService.signInWithOAuth('google');

// Sign out
await authService.signOut();
```

### Profiles Service
```javascript
import { profilesService } from './services/profiles';

// Get profile
const { data: profile } = await profilesService.getMyProfile(userId);

// Update profile
await profilesService.updateProfile(userId, { vibe: 'Adventurous', interests: ['Hiking'] });

// Set destination
await profilesService.setDestination(userId, { destination: 'Bali', emoji: '🌴', dateDisplay: 'Mar 15 – Apr 2' });

// Discover travelers
const { data: travelers } = await profilesService.discoverTravelers(userId);

// Calculate compatibility
const score = profilesService.calcCompatibility(myProfile, otherProfile);
```

### Matching Service
```javascript
import { matchingService } from './services/matching';

// Swipe right (like)
const { isMatch, match } = await matchingService.swipe(myId, theirId, 'like');

// Get matches
const { data: matches } = await matchingService.getMatches(userId);

// Real-time match subscription
matchingService.subscribeToMatches(userId, (newMatch) => {
  console.log('New match!', newMatch);
});
```

### Messaging Service
```javascript
import { messagingService } from './services/messaging';

// Get conversations
const { data: convos } = await messagingService.getConversations(userId);

// Send message
await messagingService.sendMessage(conversationId, userId, 'Hey! Ready for Bali?');

// Send location
await messagingService.sendLocation(conversationId, userId, -8.65, 115.21, 'Ubud');

// Send image
await messagingService.sendImage(conversationId, userId, imageFile);

// Real-time message subscription
messagingService.subscribeToMessages(conversationId, (newMsg) => {
  console.log('New message:', newMsg);
});

// Typing indicators
messagingService.sendTypingIndicator(conversationId, userId, true);
messagingService.subscribeToTyping(conversationId, ({ user_id, is_typing }) => {
  console.log(user_id, 'is typing:', is_typing);
});

// Presence tracking
await messagingService.trackPresence(userId);

// Create group chat
await messagingService.createGroupConversation(myId, [friend1Id, friend2Id], 'Bali Squad 🌴', '🏖️');
```

### Trips Service
```javascript
import { tripsService } from './services/trips';

// Create trip
await tripsService.createTrip(userId, {
  destination: 'Bali', emoji: '🌴',
  startDate: '2026-03-15', endDate: '2026-04-02',
  dateDisplay: 'Mar 15 – Apr 2',
  conversationId, memberIds: [buddyId],
});

// Add itinerary
const { data: day } = await tripsService.addItineraryDay(tripId, 1, 'Arrive & Settle');
await tripsService.addItineraryItem(day.id, { title: 'Airport pickup', time: '10:00 AM' });
```

### Expenses Service
```javascript
import { expensesService } from './services/expenses';

// Add expense
await expensesService.addExpense(tripId, {
  description: 'Airbnb (3 nights)', amount: 180,
  paidBy: userId, memberIds: [userId, buddyId],
});

// Calculate who owes who
const { balances, total } = await expensesService.calculateBalances(tripId);
```

## 🪝 React Hooks

```javascript
import { useAuth, useProfile, useDiscovery, useChat, useTrips, useExpenses } from './hooks/useSupabase';

function App() {
  const { user, signIn, signOut } = useAuth();
  const { profile, updateProfile } = useProfile(user?.id);
  const { currentTraveler, swipe } = useDiscovery(user?.id);
  const { messages, sendMessage, typingUsers } = useChat(conversationId, user?.id);
  const { trips, createTrip } = useTrips(user?.id);
  const { expenses, addExpense, balances } = useExpenses(tripId);
}
```

## 🔒 Security

- **Row Level Security** on all tables — users only access their own data
- **Auth required** for all writes
- **Blocked users** excluded from discovery
- **Report system** with admin review pipeline
- **Storage policies** — users can only upload to their own folders

## 📱 Demo Mode

The app runs in **demo mode** when no Supabase credentials are set. All services return mock data so you can explore the full UI without a backend. Set your `.env` variables to switch to live mode.

## 🚢 Deployment

### Vercel
```bash
npm run build
# Deploy dist/ folder to Vercel
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel env vars
```

### Netlify
```bash
npm run build
# Deploy dist/ folder to Netlify
# Set env vars in Netlify dashboard
```

### Mobile (React Native)
The service layer (`src/services/`) and hooks (`src/hooks/`) are framework-agnostic. To go mobile:
1. Replace `@supabase/supabase-js` with `@supabase/supabase-js` (works the same)
2. Add `@react-native-async-storage/async-storage` for session persistence
3. Swap React components for React Native components
4. Add push notifications via Supabase Edge Functions + FCM/APNs

## 📊 Database Diagram

```
profiles ──┐
           ├── destinations
           ├── swipes ──→ matches ──→ conversations ──→ messages
           ├── stories                      │
           ├── notifications                ├── conversation_members
           ├── blocks                       │
           └── reports               trips ─┤
                                     │      ├── trip_members
                                     │      ├── itinerary_days ──→ itinerary_items
                                     │      └── expenses ──→ expense_splits
```

## 📄 License

MIT
