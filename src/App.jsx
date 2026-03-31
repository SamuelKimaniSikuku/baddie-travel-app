import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth, useProfile, useDiscovery, useMatches, useConversations, useChat, useTrips } from "./hooks/useSupabase";
import { isDemo } from "./lib/supabase";
import { profilesService } from "./services/profiles";
import { authService } from "./services/auth";

// ══════════════════════════════════════════════════════════════
// BADDIE 2.0 — Improved Travel App
// Auth → Discover → Explore → Match → Chat → Trip Planner
// ══════════════════════════════════════════════════════════════

// ─── Design Tokens ───────────────────────────────────────────
const T = {
  flame: "#FF4136", coral: "#FF6B5A", sunset: "#FF8C42", gold: "#FFB830",
  midnight: "#0A0A14", ink: "#14142B", charcoal: "#1E1E32", slate: "#2D2D48",
  ash: "#6E6E8A", mist: "#A0A0BE", cloud: "#E8E8F0", snow: "#F5F5FA",
  white: "#FFFFFF", mint: "#00D4AA", electric: "#5B5BFF", rose: "#FF3B6F",
  sky: "#38BDF8", violet: "#A78BFA", lime: "#84CC16",
  glass: "rgba(255,255,255,0.06)", glassBorder: "rgba(255,255,255,0.1)",
};

const CATEGORY_ICONS = {
  flight: "✈️", transport: "🚕", accommodation: "🏨", food: "🍜",
  activity: "🎯", sightseeing: "📸", shopping: "🛍️", nightlife: "🌙",
  relaxation: "🧘", other: "📌", insurance: "🛡️", visa: "📄", tips: "💰",
};

// ─── Mock Data ────────────────────────────────────────────────
const TRAVELERS = [
  { id: "d1", name: "Sofia", age: 26, avatar: "🧕", verified: true, city: "Barcelona", destination: "Bali", destEmoji: "🇮🇩", destination_emoji: "🇮🇩", dates: "Mar 15 - Apr 2", date_display: "Mar 15 - Apr 2", bio: "Yoga retreats, sunrise hikes, and street food adventures.", vibe: "Adventurous", budget: "Mid-range", interests: ["Yoga", "Hiking", "Food", "Photography"], compatibility: 94 },
  { id: "d2", name: "Marcus", age: 29, avatar: "👨🏾", verified: true, city: "London", destination: "Tokyo", destEmoji: "🇯🇵", destination_emoji: "🇯🇵", dates: "Apr 5 - Apr 20", date_display: "Apr 5 - Apr 20", bio: "Anime nerd meets foodie. Ramen shops and arcade adventures.", vibe: "Cultural", budget: "Flexible", interests: ["Anime", "Ramen", "Nightlife", "Sneakers"], compatibility: 87 },
  { id: "d3", name: "Ayla", age: 24, avatar: "👩🏽", verified: false, city: "Istanbul", destination: "Morocco", destEmoji: "🇲🇦", destination_emoji: "🇲🇦", dates: "May 1 - May 14", date_display: "May 1 - May 14", bio: "Photographer chasing golden hour. Let's get lost in the medinas.", vibe: "Creative", budget: "Budget", interests: ["Photography", "Art", "Tea", "Architecture"], compatibility: 91 },
  { id: "d4", name: "Kai", age: 31, avatar: "👨🏽", verified: true, city: "Auckland", destination: "Patagonia", destEmoji: "🇦🇷", destination_emoji: "🇦🇷", dates: "Jun 10 - Jul 1", date_display: "Jun 10 - Jul 1", bio: "Mountaineer & trail runner. Planning the W Trek.", vibe: "Extreme", budget: "Mid-range", interests: ["Trekking", "Camping", "Wildlife", "Climbing"], compatibility: 78 },
  { id: "d5", name: "Priya", age: 27, avatar: "👩🏽", verified: true, city: "Mumbai", destination: "Greece", destEmoji: "🇬🇷", destination_emoji: "🇬🇷", dates: "Jul 5 - Jul 18", date_display: "Jul 5 - Jul 18", bio: "Island hopping, sunset cocktails, and ancient ruins.", vibe: "Social", budget: "Luxury", interests: ["Islands", "History", "Cocktails", "Sailing"], compatibility: 85 },
  { id: "d6", name: "Liam", age: 28, avatar: "🧑🏻", verified: true, city: "Dublin", destination: "Vietnam", destEmoji: "🇻🇳", destination_emoji: "🇻🇳", dates: "Aug 1 - Aug 20", date_display: "Aug 1 - Aug 20", bio: "Backpacker with a coffee addiction.", vibe: "Adventurous", budget: "Budget", interests: ["Coffee", "Motorbikes", "Street Food"], compatibility: 82 },
];

const DESTINATIONS = [
  { name: "Bali", emoji: "🇮🇩", tag: "Spiritual", color: T.sunset, count: 47, daily: "$45–80", wifi: "⚡ Fast", safety: "🟢 Safe" },
  { name: "Tokyo", emoji: "🇯🇵", tag: "Urban", color: T.sky, count: 62, daily: "$80–150", wifi: "⚡⚡ Ultra", safety: "🟢 Safe" },
  { name: "Morocco", emoji: "🇲🇦", tag: "Cultural", color: T.gold, count: 31, daily: "$30–60", wifi: "📶 Good", safety: "🟡 Moderate" },
  { name: "Patagonia", emoji: "🇦🇷", tag: "Adventure", color: T.mint, count: 18, daily: "$60–100", wifi: "📶 Limited", safety: "🟢 Safe" },
  { name: "Greece", emoji: "🇬🇷", tag: "Relaxation", color: T.violet, count: 55, daily: "$70–120", wifi: "⚡ Fast", safety: "🟢 Safe" },
  { name: "Vietnam", emoji: "🇻🇳", tag: "Budget", color: T.lime, count: 43, daily: "$25–55", wifi: "⚡ Fast", safety: "🟢 Safe" },
];

const VIBES = ["Adventurous", "Cultural", "Creative", "Extreme", "Social", "Chill"];
const BUDGETS = ["Budget", "Mid-range", "Flexible", "Luxury"];
const ALL_INTERESTS = ["Hiking", "Food", "Photography", "Yoga", "Nightlife", "Art", "Music", "Sports", "History", "Nature", "Sailing", "Trekking", "Coffee", "Architecture"];

const REPLIES = [
  "That sounds amazing! 🔥", "I'm so down!", "Checking flights now ✈️",
  "Great find! Saving this 📌", "What's your budget?",
  "Let me send you the itinerary 📋", "Can't wait!! 🙌",
  "We should split an Airbnb!", "Just booked my hostel! 🏠",
  "Let's do it! This trip is going to be epic ✈️",
];

function calcCompat(me, them) {
  let s = 50;
  if (me.vibe === them.vibe) s += 20;
  if (me.budget === them.budget) s += 10;
  s += (me.interests || []).filter(i => (them.interests || []).includes(i)).length * 8;
  return Math.min(s, 99);
}

// ─── Global CSS ───────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body, #root { height: 100%; overflow: hidden; }
body { font-family: 'Sora', sans-serif; background: ${T.midnight}; color: ${T.white}; }
input, textarea, button, select { font-family: 'Sora', sans-serif; }
::-webkit-scrollbar { width: 2px; }
::-webkit-scrollbar-thumb { background: ${T.slate}; border-radius: 2px; }
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }
@keyframes slideInR { from { opacity: 0; transform: translateX(28px) } to { opacity: 1; transform: translateX(0) } }
@keyframes slideInL { from { opacity: 0; transform: translateX(-28px) } to { opacity: 1; transform: translateX(0) } }
@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
@keyframes popIn { from { opacity: 0; transform: scale(0.7) rotate(-8deg) } 60% { transform: scale(1.08) rotate(2deg) } to { opacity: 1; transform: scale(1) rotate(0) } }
@keyframes confetti { 0% { transform: translateY(-100vh) rotate(0); opacity: 1 } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0 } }
@keyframes typing { 0%, 60% { opacity: .3 } 30% { opacity: 1 } }
@keyframes float { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
@keyframes gradShift { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,65,54,.4) } 70% { box-shadow: 0 0 0 8px rgba(255,65,54,0) } }
@keyframes badgePop { from { opacity: 0; transform: scale(0.5) } to { opacity: 1; transform: scale(1) } }
`;

// ─── Shared Utilities ─────────────────────────────────────────
let toastListeners = [];
function showToast(msg) { toastListeners.forEach(fn => fn(msg)); }

function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const fn = msg => {
      const id = Date.now();
      setToasts(p => [...p, { id, ...msg }]);
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3400);
    };
    toastListeners.push(fn);
    return () => { toastListeners = toastListeners.filter(l => l !== fn); };
  }, []);
  return (
    <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 999, display: "flex", flexDirection: "column", gap: 7, pointerEvents: "none", width: "calc(100% - 24px)", maxWidth: 420 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 14, background: t.color || "rgba(20,20,43,0.97)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,.4)", animation: "fadeInUp 0.3s ease" }}>
          <span style={{ fontSize: 18 }}>{t.icon || "🔔"}</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{t.title}</p>
            {t.body && <p style={{ fontSize: 10, color: "rgba(255,255,255,.55)", marginTop: 1 }}>{t.body}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function Glass({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{ background: T.glass, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid " + T.glassBorder, borderRadius: 16, ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ children, style }) {
  return <p style={{ fontSize: 9, color: T.ash, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, ...style }}>{children}</p>;
}

function PrimaryBtn({ children, onClick, style, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: "100%", padding: "13px", borderRadius: 14, border: "none", background: disabled ? T.slate : `linear-gradient(135deg,${T.flame},${T.sunset})`, color: T.white, fontSize: 14, fontWeight: 700, cursor: disabled ? "default" : "pointer", boxShadow: disabled ? "none" : `0 4px 20px ${T.flame}35`, opacity: disabled ? 0.6 : 1, transition: "all .2s", ...style }}>
      {children}
    </button>
  );
}

function SecondaryBtn({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{ width: "100%", padding: "12px", borderRadius: 14, border: "1px solid " + T.glassBorder, background: T.glass, color: T.white, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all .2s", ...style }}>
      {children}
    </button>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────
function TabBar({ tab, onTab, matchCount }) {
  const tabs = [
    { id: "discover", icon: "✈️", label: "Discover" },
    { id: "explore", icon: "🌍", label: "Explore" },
    { id: "chats", icon: "💬", label: "Chats", badge: matchCount },
    { id: "trips", icon: "🗺️", label: "Trips" },
    { id: "profile", icon: "😎", label: "Profile" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "8px 12px 12px", gap: 2, borderTop: "1px solid rgba(255,255,255,.06)", background: `linear-gradient(to top,${T.ink},${T.midnight})`, flexShrink: 0 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onTab(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 0", borderRadius: 12, border: "none", background: "none", cursor: "pointer", transition: "all .2s" }}>
          <div style={{ position: "relative" }}>
            <span style={{ fontSize: 20, display: "block", transform: tab === t.id ? "scale(1.15)" : "scale(1)", transition: "transform .2s" }}>{t.icon}</span>
            {t.badge > 0 && tab !== t.id && (
              <div style={{ position: "absolute", top: -4, right: -8, background: T.flame, color: "#fff", fontSize: 8, fontWeight: 700, borderRadius: 8, padding: "1px 4px", animation: "badgePop .3s ease", minWidth: 14, textAlign: "center" }}>{t.badge}</div>
            )}
          </div>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase", color: tab === t.id ? T.flame : T.ash, transition: "color .2s" }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// AUTH SCREEN
// ══════════════════════════════════════════════════════════════
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("splash");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMode("login"), 2200);
    return () => clearTimeout(t);
  }, []);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      if (isDemo) {
        setTimeout(() => onLogin({ name: name || "Traveler", email }), 900);
        return;
      }
      const isSignup = mode === "signup";
      if (isSignup) {
        const result = await authService.signUp({ email, password: pw, name: name || "Traveler", avatar: "😎" });
        if (result.error) { setError(result.error.message); setLoading(false); return; }
        if (result.user && !result.session) { setEmailSent(true); setLoading(false); return; }
        if (result.user) onLogin(result.user);
      } else {
        const result = await authService.signIn({ email, password: pw });
        if (result.error) { setError(result.error.message); setLoading(false); return; }
        if (result.user) onLogin(result.user);
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
      setLoading(false);
    }
  }

  if (mode === "splash") {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `radial-gradient(ellipse at 30% 20%,${T.flame}22 0%,transparent 50%),${T.midnight}` }}>
        <div style={{ animation: "popIn 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards", textAlign: "center" }}>
          <div style={{ fontSize: 56, animation: "float 3s ease-in-out infinite" }}>✈️</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 52, fontWeight: 900, background: `linear-gradient(135deg,${T.flame},${T.sunset},${T.gold})`, backgroundSize: "200% 200%", animation: "gradShift 3s ease infinite", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: -2 }}>baddie</h1>
          <p style={{ color: T.mist, fontSize: 12, letterSpacing: 5, textTransform: "uppercase", fontWeight: 300, marginTop: 10 }}>find your travel tribe</p>
        </div>
      </div>
    );
  }

  if (emailSent) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", background: `radial-gradient(ellipse at 20% 0%,${T.flame}12 0%,transparent 50%),${T.midnight}`, animation: "fadeIn .5s ease" }}>
        <div style={{ animation: "popIn 0.6s cubic-bezier(0.34,1.56,0.64,1)", maxWidth: 340 }}>
          <div style={{ fontSize: 72, marginBottom: 20, animation: "float 3s ease-in-out infinite" }}>✉️</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 900, marginBottom: 10, background: `linear-gradient(135deg,${T.flame},${T.sunset})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Check your email!</h2>
          <p style={{ color: T.mist, fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>We sent a confirmation link to</p>
          <p style={{ color: T.coral, fontWeight: 700, fontSize: 15, marginBottom: 20, background: T.flame + "15", padding: "8px 16px", borderRadius: 12, display: "inline-block" }}>{email}</p>
          <p style={{ color: T.ash, fontSize: 12, lineHeight: 1.6, marginBottom: 28 }}>Click the link in your email to activate your account, then come back and sign in.</p>
          <PrimaryBtn onClick={() => { setEmailSent(false); setMode("login"); setError(""); }}>Go to Sign In ✈️</PrimaryBtn>
          <p style={{ color: T.ash, fontSize: 11, marginTop: 14 }}>Didn't get it? <span onClick={submit} style={{ color: T.coral, cursor: "pointer", fontWeight: 600 }}>Resend email</span></p>
        </div>
      </div>
    );
  }

  const isSignupMode = mode === "signup";
  const inputSt = { width: "100%", padding: "13px 16px", borderRadius: 14, border: "1px solid " + T.glassBorder, background: T.glass, color: T.white, fontSize: 14, outline: "none" };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: `radial-gradient(ellipse at 20% 0%,${T.flame}12 0%,transparent 50%),${T.midnight}`, animation: "fadeIn .5s ease" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 40, animation: "fadeInUp .5s ease" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✈️</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 900, background: `linear-gradient(135deg,${T.flame},${T.sunset})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>baddie</h1>
          <p style={{ color: T.ash, fontSize: 12, marginTop: 6 }}>{isSignupMode ? "Create your account" : "Welcome back, traveler"}</p>
          {isDemo && <p style={{ color: T.gold, fontSize: 10, marginTop: 6, background: T.gold + "15", padding: "4px 12px", borderRadius: 8, display: "inline-block" }}>Demo Mode — No real account needed</p>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeInUp .5s ease .1s both" }}>
          {isSignupMode && <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputSt} />}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={inputSt} />
          <input value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" type="password" style={inputSt} onKeyDown={e => e.key === "Enter" && submit()} />
          {error && <p style={{ color: T.rose, fontSize: 12, textAlign: "center" }}>{error}</p>}
          <PrimaryBtn onClick={submit} disabled={loading}>{loading ? "Taking off... ✈️" : isSignupMode ? "Create Account" : "Sign In"}</PrimaryBtn>
        </div>
        <p style={{ textAlign: "center", marginTop: 28, fontSize: 13, color: T.ash }}>
          {isSignupMode ? "Already have an account? " : "New to Baddie? "}
          <span onClick={() => { setMode(isSignupMode ? "login" : "signup"); setError(""); }} style={{ color: T.coral, cursor: "pointer", fontWeight: 600 }}>
            {isSignupMode ? "Sign in" : "Create account"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DISCOVER SCREEN
// ══════════════════════════════════════════════════════════════
function DiscoverScreen({ onMatch, matches, userId, userProfile }) {
  const discovery = useDiscovery(isDemo ? null : userId);
  const [demoCards, setDemoCards] = useState(() => TRAVELERS.filter(t => !matches.find(m => m.id === t.id)));
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [exitDir, setExitDir] = useState(null);
  const [superLiked, setSuperLiked] = useState(null);
  const startX = useRef(0);

  const current = isDemo ? demoCards[demoCards.length - 1] : discovery.currentTraveler;
  const hasMore = isDemo ? demoCards.length > 0 : discovery.hasMore;
  const likeOp = Math.min(1, Math.max(0, dragX / 90));
  const nopeOp = Math.min(1, Math.max(0, -dragX / 90));

  function onStart(x) { setDragging(true); startX.current = x; }
  function onMove(x) { if (dragging) setDragX(x - startX.current); }
  function onEnd() {
    setDragging(false);
    if (Math.abs(dragX) > 110) swipe(dragX > 0 ? "right" : "left");
    else setDragX(0);
  }

  async function swipe(dir) {
    setExitDir(dir);
    setTimeout(async () => {
      if (isDemo) {
        if (dir === "right" && current) onMatch(current);
        setDemoCards(p => p.slice(0, -1));
      } else {
        if (current) {
          const result = await discovery.swipe(current.id, dir === "right" ? "like" : "dislike");
          if (result?.isMatch) onMatch(current);
        }
      }
      setExitDir(null); setDragX(0);
    }, 280);
  }

  function handleSuperLike() {
    if (!current) return;
    setSuperLiked(current.id);
    showToast({ icon: "⭐", title: `Super liked ${current.name}!`, body: "They'll definitely notice!", color: `rgba(56,189,248,.92)` });
    setTimeout(() => { setSuperLike(null); swipe("right"); }, 600);
  }

  if (!current || !hasMore) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ fontSize: 64, marginBottom: 14, animation: "float 3s ease-in-out infinite" }}>🌍</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22 }}>You've seen everyone!</h2>
        <p style={{ color: T.ash, marginTop: 8, textAlign: "center", fontSize: 13, lineHeight: 1.6 }}>New travelers join every day. Check back soon!</p>
        {isDemo && <PrimaryBtn style={{ marginTop: 24, maxWidth: 200 }} onClick={() => setDemoCards([...TRAVELERS])}>Reset Demo</PrimaryBtn>}
      </div>
    );
  }

  const displayName = current.name || "Traveler";
  const displayDest = current.destination || "";
  const displayDestEmoji = current.destEmoji || current.destination_emoji || "🌍";
  const displayDates = current.dates || current.date_display || "";
  const displayBio = current.bio || "";
  const displayCity = current.city || "";
  const displayAge = current.age || "";
  const displayAvatar = current.avatar || current.avatar_url || "😎";
  const displayInterests = current.interests || [];
  const compat = userProfile ? profilesService.calcCompatibility(userProfile, current) : calcCompat({ vibe: "Adventurous", budget: "Mid-range", interests: ["Hiking", "Food", "Photography"] }, current);
  const stack = isDemo ? demoCards.slice(-3, -1) : [];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 16px 8px", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "14px 0 8px", flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 900, background: `linear-gradient(135deg,${T.flame},${T.sunset},${T.gold})`, backgroundSize: "200% 200%", animation: "gradShift 4s ease infinite", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: -1 }}>baddie</h1>
          <p style={{ fontSize: 10, color: T.ash, marginTop: 1 }}>Find your travel tribe</p>
        </div>
        <div style={{ background: T.flame + "18", border: `1px solid ${T.flame}33`, borderRadius: 10, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 14 }}>🔥</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.coral }}>{matches.length} matched</span>
        </div>
      </div>

      {/* Card Stack */}
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {stack.map((c, i) => (
          <div key={c.id} style={{ position: "absolute", width: "100%", maxWidth: 350, aspectRatio: "3/4.2", borderRadius: 24, background: T.charcoal, border: "1px solid " + T.glassBorder, transform: `scale(${0.91 + i * 0.05}) translateY(${(1 - i) * 12}px)`, opacity: 0.3 + i * 0.35 }} />
        ))}
        <div
          onMouseDown={e => onStart(e.clientX)}
          onMouseMove={e => onMove(e.clientX)}
          onMouseUp={onEnd}
          onMouseLeave={() => { if (dragging) onEnd(); }}
          onTouchStart={e => onStart(e.touches[0].clientX)}
          onTouchMove={e => onMove(e.touches[0].clientX)}
          onTouchEnd={onEnd}
          style={{
            position: "absolute", width: "100%", maxWidth: 350, aspectRatio: "3/4.2",
            borderRadius: 24, overflow: "hidden", cursor: dragging ? "grabbing" : "grab",
            transform: exitDir
              ? `translateX(${exitDir === "right" ? 500 : -500}px) rotate(${exitDir === "right" ? 25 : -25}deg)`
              : `translateX(${dragX}px) rotate(${dragX * 0.065}deg)`,
            transition: dragging ? "none" : "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            userSelect: "none",
          }}
        >
          <div style={{ width: "100%", height: "100%", background: current.avatar_url ? `url(${current.avatar_url}) center/cover` : `linear-gradient(135deg,${T.flame}40,${T.sunset}30,${T.violet}20)`, position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.15) 55%,transparent 100%)" }} />

            {/* Swipe indicators */}
            <div style={{ position: "absolute", top: 24, left: 18, padding: "5px 16px", border: `2.5px solid ${T.mint}`, borderRadius: 8, transform: "rotate(-15deg)", opacity: likeOp, color: T.mint, fontWeight: 800, fontSize: 22, letterSpacing: 2 }}>LET'S GO</div>
            <div style={{ position: "absolute", top: 24, right: 18, padding: "5px 16px", border: `2.5px solid ${T.rose}`, borderRadius: 8, transform: "rotate(15deg)", opacity: nopeOp, color: T.rose, fontWeight: 800, fontSize: 22, letterSpacing: 2 }}>NOPE</div>

            {/* Match % badge */}
            <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,.55)", backdropFilter: "blur(10px)", borderRadius: 12, padding: "5px 10px", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: T.mint, fontWeight: 700, fontSize: 13 }}>{compat}%</span>
              <span style={{ fontSize: 9, color: T.mist }}>match</span>
            </div>

            {/* Verified badge */}
            {current.verified && (
              <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,.55)", backdropFilter: "blur(10px)", borderRadius: 10, padding: "4px 9px", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 10 }}>✅</span>
                <span style={{ fontSize: 9, color: T.mint, fontWeight: 600 }}>Verified</span>
              </div>
            )}

            {/* Avatar fallback */}
            {!current.avatar_url && <div style={{ position: "absolute", top: "28%", left: "50%", transform: "translateX(-50%)", fontSize: 80 }}>{displayAvatar}</div>}

            {/* Card info */}
            <div style={{ position: "relative", padding: "18px 16px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 5 }}>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700 }}>{displayName}{displayAge ? `, ${displayAge}` : ""}</h2>
                <span style={{ fontSize: 11, color: T.mist }}>📍 {displayCity}</span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `linear-gradient(135deg,${T.flame}cc,${T.sunset}cc)`, borderRadius: 18, padding: "4px 13px", marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>{displayDestEmoji}</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{displayDest}</span>
                <span style={{ fontSize: 10, opacity: .85 }}>· {displayDates}</span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,.82)", lineHeight: 1.55, marginBottom: 9 }}>{displayBio}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {displayInterests.slice(0, 4).map(i => <span key={i} style={{ background: "rgba(255,255,255,.12)", borderRadius: 10, padding: "3px 10px", fontSize: 10 }}>{i}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 5, padding: "6px 0 4px", flexShrink: 0 }}>
        {TRAVELERS.slice(0, 6).map((_, i) => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i < demoCards.length ? T.flame : T.slate, transition: "background .3s" }} />
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 18, padding: "6px 0 4px", flexShrink: 0 }}>
        <button onClick={() => swipe("left")} style={{ width: 54, height: 54, borderRadius: "50%", border: `2px solid ${T.rose}44`, background: T.rose + "12", color: T.rose, cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>✕</button>
        <button onClick={handleSuperLike} title="Super Like" style={{ width: 44, height: 44, borderRadius: "50%", border: `2px solid ${T.sky}44`, background: T.sky + "12", color: T.sky, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>⭐</button>
        <button onClick={() => swipe("right")} style={{ width: 54, height: 54, borderRadius: "50%", border: `2px solid ${T.mint}44`, background: T.mint + "12", color: T.mint, cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>✈</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// EXPLORE SCREEN (NEW)
// ══════════════════════════════════════════════════════════════
function ExploreScreen() {
  const [activeVibe, setActiveVibe] = useState(null);
  const vibeFilters = ["🏖️ Beach", "🏔️ Mountains", "🌆 Urban", "🧘 Wellness", "🎭 Culture", "🍜 Foodie", "🎒 Budget", "✨ Luxury"];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px 8px", flexShrink: 0 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900 }}>Explore</h2>
        <p style={{ fontSize: 11, color: T.ash, marginTop: 2 }}>Trending destinations</p>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "0 16px 16px" }}>
        {/* Destination Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {DESTINATIONS.map(d => (
            <div key={d.name} onClick={() => showToast({ icon: d.emoji, title: d.name + " Explorer", body: `${d.count} travelers going · ${d.daily}/day`, color: "rgba(30,30,50,.97)" })} style={{ borderRadius: 18, overflow: "hidden", cursor: "pointer", background: d.color + "18", border: `1px solid ${d.color}30`, padding: 14, transition: "transform .2s" }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>{d.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</div>
              <div style={{ fontSize: 9, color: d.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>{d.tag}</div>
              <div style={{ fontSize: 10, color: T.ash, marginTop: 3 }}>{d.count} travelers</div>
            </div>
          ))}
        </div>

        {/* Vibe Filters */}
        <SectionLabel>Trending Vibes</SectionLabel>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 20, scrollbarWidth: "none" }}>
          {vibeFilters.map(v => (
            <button key={v} onClick={() => { setActiveVibe(v === activeVibe ? null : v); showToast({ icon: "🎯", title: `Filter: ${v}`, body: "Filtering travelers by vibe!", color: `rgba(255,140,66,.9)` }); }}
              style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 20, border: `1px solid ${v === activeVibe ? T.flame : T.glassBorder}`, background: v === activeVibe ? T.flame + "22" : T.glass, color: v === activeVibe ? T.coral : T.cloud, fontSize: 11, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", transition: "all .2s" }}>
              {v}
            </button>
          ))}
        </div>

        {/* Cost Index */}
        <SectionLabel>Travel Cost Index</SectionLabel>
        {DESTINATIONS.map(d => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 14, background: T.glass, border: "1px solid " + T.glassBorder, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>{d.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div>
              <div style={{ fontSize: 10, color: T.ash, marginTop: 2 }}>Daily: <span style={{ color: T.gold, fontWeight: 600 }}>{d.daily}</span></div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: T.mist }}>{d.wifi}</div>
              <div style={{ fontSize: 10, marginTop: 2 }}>{d.safety}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MATCH OVERLAY
// ══════════════════════════════════════════════════════════════
function MatchOverlay({ match, userAvatar, onMessage, onClose }) {
  const colors = [T.flame, T.sunset, T.gold, T.mint, T.electric, T.rose];
  const matchDest = match.destination || match.shared_destination || "";
  const matchEmoji = match.destEmoji || match.destination_emoji || "🌍";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.92)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "fadeIn .3s" }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", top: -20, left: Math.random() * 100 + "%", width: 8, height: 8, borderRadius: Math.random() > .5 ? "50%" : "2px", background: colors[i % 6], animation: `confetti ${2 + Math.random() * 2}s linear ${Math.random() * .5}s infinite` }} />
      ))}
      <div style={{ animation: "popIn 0.6s cubic-bezier(0.34,1.56,0.64,1)", textAlign: "center", padding: "0 24px" }}>
        <div style={{ fontSize: 52, marginBottom: 10, animation: "float 3s ease-in-out infinite" }}>✈️</div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 40, fontWeight: 900, background: `linear-gradient(135deg,${T.flame},${T.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>It's a Trip!</h1>
        <p style={{ color: T.mist, fontSize: 13, marginBottom: 28, marginTop: 6 }}>You and {match.name} want to explore {matchDest} {matchEmoji}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 32 }}>
          <div style={{ width: 78, height: 78, borderRadius: "50%", border: `3px solid ${T.flame}`, background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38 }}>{userAvatar}</div>
          <div style={{ fontSize: 26, animation: "pulse 1.5s ease infinite" }}>❤️</div>
          <div style={{ width: 78, height: 78, borderRadius: "50%", border: `3px solid ${T.sunset}`, background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38 }}>{match.avatar || "😎"}</div>
        </div>
        <PrimaryBtn style={{ maxWidth: 260, marginBottom: 10 }} onClick={onMessage}>Send a Message 💬</PrimaryBtn>
        <SecondaryBtn style={{ maxWidth: 260 }} onClick={onClose}>Keep Swiping</SecondaryBtn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CHATS LIST
// ══════════════════════════════════════════════════════════════
function ChatsListScreen({ matches, userId, onOpenChat }) {
  const [search, setSearch] = useState("");
  const convos = useConversations(isDemo ? null : userId);
  const displayList = isDemo ? matches : (convos.conversations || []);
  const filtered = displayList.filter(m => {
    const name = m.name || (m.match ? (m.match.user1?.name || m.match.user2?.name) : "") || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px 8px", flexShrink: 0 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900 }}>Chats</h2>
        <p style={{ fontSize: 11, color: T.ash, marginTop: 2 }}>{matches.length} travel {matches.length === 1 ? "buddy" : "buddies"}</p>
      </div>
      <div style={{ padding: "0 16px 10px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.glass, border: "1px solid " + T.glassBorder, borderRadius: 12, padding: "9px 12px" }}>
          <span style={{ color: T.ash, fontSize: 14 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats..." style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.white, fontSize: 12 }} />
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "0 16px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>💬</div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20 }}>No chats yet</h3>
            <p style={{ color: T.ash, fontSize: 12, marginTop: 6, lineHeight: 1.6 }}>Match with travelers to start chatting!</p>
          </div>
        ) : filtered.map((m, i) => {
          let displayName = m.name || "";
          let displayAvatar = m.avatar || "😎";
          let displayDest = m.destination || m.shared_destination || "";
          let displayDestEmoji = m.destEmoji || m.destination_emoji || "🌍";
          let lastMsg = m.lastMessage ? m.lastMessage.content : "Matched! Say hi 👋";
          const unread = m.unreadCount || 0;
          if (!isDemo && m.match) {
            const otherUser = m.match.user1?.id === userId ? m.match.user2 : m.match.user1;
            displayName = otherUser?.name || "Traveler";
            displayAvatar = otherUser?.avatar || "😎";
            displayDest = m.match.shared_destination || "";
          }
          return (
            <div key={m.id} onClick={() => onOpenChat(m)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid " + T.glass, cursor: "pointer", animation: `fadeInUp .3s ease ${i * .04}s both` }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, border: "2px solid " + T.glassBorder, position: "relative", flexShrink: 0 }}>
                {displayAvatar}
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: "50%", background: T.mint, border: `2px solid ${T.midnight}` }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{displayName}</span>
                  <span style={{ color: T.ash, fontSize: 9 }}>Now</span>
                </div>
                <p style={{ color: T.mist, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lastMsg}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div style={{ background: `linear-gradient(135deg,${T.flame}33,${T.sunset}33)`, borderRadius: 8, padding: "3px 8px", fontSize: 10, color: T.coral }}>{displayDestEmoji} {displayDest}</div>
                {unread > 0 && <div style={{ background: T.flame, borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{unread}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CHAT DETAIL + SHARE SHEET
// ══════════════════════════════════════════════════════════════
const SHARE_OPTIONS = [
  { id: "flight", icon: "✈️", label: "Flight", color: T.sky },
  { id: "itinerary", icon: "📋", label: "Day Plan", color: T.mint },
  { id: "expense", icon: "💰", label: "Expense", color: T.gold },
  { id: "poll", icon: "📊", label: "Poll", color: T.violet },
  { id: "packing", icon: "🎒", label: "Packing", color: T.coral },
  { id: "checklist", icon: "✅", label: "Checklist", color: T.lime },
  { id: "location", icon: "📍", label: "Location", color: T.rose },
];

function FlightCard({ data, isMine }) {
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", width: 250, background: isMine ? "rgba(255,65,54,0.08)" : "rgba(255,255,255,0.05)", border: `1px solid ${isMine ? T.flame + "33" : T.glassBorder}` }}>
      <div style={{ padding: "7px 11px", display: "flex", alignItems: "center", justifyContent: "space-between", background: T.sky + "12", borderBottom: "1px solid " + T.glassBorder }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 13 }}>✈️</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>{data.airline}</span>
          <span style={{ fontSize: 9, color: T.ash }}>{data.flight_number}</span>
        </div>
        <span style={{ fontSize: 8, padding: "2px 7px", borderRadius: 6, fontWeight: 600, background: T.gold + "22", color: T.gold, textTransform: "uppercase" }}>{data.status || "found"}</span>
      </div>
      <div style={{ padding: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display',serif" }}>{data.from}</div>
            <div style={{ fontSize: 8, color: T.ash }}>{data.fromCity}</div>
          </div>
          <div style={{ flex: 1, margin: "0 8px", height: 1, background: T.mist + "44", position: "relative" }}>
            <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontSize: 8, color: T.mist, background: T.midnight, padding: "0 4px" }}>{data.duration || "—"}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Playfair Display',serif" }}>{data.to}</div>
            <div style={{ fontSize: 8, color: T.ash }}>{data.toCity}</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
          <span style={{ color: T.mist }}>{data.date || ""}</span>
          <span style={{ fontWeight: 700, color: T.gold }}>${data.price}</span>
        </div>
      </div>
      <button style={{ width: "100%", padding: 7, border: "none", borderTop: "1px solid " + T.glassBorder, background: "transparent", color: T.sky, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>📌 Save to Trip</button>
    </div>
  );
}

function PollCard({ data, onVote }) {
  const total = data.options.reduce((s, o) => s + (o.votes || []).length, 0);
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", width: 250, background: "rgba(255,255,255,0.05)", border: "1px solid " + T.glassBorder }}>
      <div style={{ padding: "7px 11px", background: T.violet + "12", borderBottom: "1px solid " + T.glassBorder }}>
        <span style={{ fontSize: 11, fontWeight: 600 }}>📊 {data.question}</span>
      </div>
      <div style={{ padding: "6px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
        {data.options.map(opt => {
          const pct = total > 0 ? ((opt.votes || []).length / total) * 100 : 0;
          const voted = (opt.votes || []).includes("me");
          return (
            <div key={opt.id} onClick={() => onVote && onVote(opt.id)} style={{ position: "relative", padding: "7px 10px", borderRadius: 8, cursor: "pointer", border: `1px solid ${voted ? T.violet + "66" : T.glassBorder}`, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: pct + "%", background: voted ? T.violet + "20" : T.white + "06", transition: "width .4s", borderRadius: 8 }} />
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11 }}>{opt.text}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: voted ? T.violet : T.ash }}>{Math.round(pct)}%</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "5px 10px", borderTop: "1px solid " + T.glassBorder, fontSize: 9, color: T.ash, textAlign: "center" }}>{total} votes</div>
    </div>
  );
}

function ItineraryCard({ data }) {
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", width: 250, background: "rgba(255,255,255,0.05)", border: "1px solid " + T.glassBorder }}>
      <div style={{ padding: "7px 11px", background: T.mint + "12", borderBottom: "1px solid " + T.glassBorder, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600 }}>📋 {data.title}</span>
        <span style={{ fontSize: 9, color: T.ash }}>{data.date}</span>
      </div>
      <div style={{ padding: "4px 0" }}>
        {(data.activities || []).map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 11px" }}>
            <span style={{ fontSize: 9, color: T.mist, minWidth: 34, fontWeight: 500 }}>{a.time}</span>
            <span style={{ fontSize: 12 }}>{a.icon}</span>
            <span style={{ fontSize: 10, flex: 1 }}>{a.title}</span>
            {a.cost > 0 && <span style={{ fontSize: 9, color: T.gold }}>${a.cost}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpenseCard({ data }) {
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", width: 250, background: "rgba(255,255,255,0.05)", border: "1px solid " + T.glassBorder }}>
      <div style={{ padding: "7px 11px", background: T.gold + "12", borderBottom: "1px solid " + T.glassBorder }}>
        <span style={{ fontSize: 11, fontWeight: 600 }}>💰 {data.title}</span>
      </div>
      <div style={{ padding: "4px 0" }}>
        {(data.items || []).map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 11px" }}>
            <span style={{ fontSize: 12 }}>{item.icon}</span>
            <span style={{ fontSize: 10, flex: 1 }}>{item.label}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: T.gold }}>${item.amount}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "8px 11px", borderTop: "1px solid " + T.glassBorder, background: T.gold + "08", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 700 }}>Total: <span style={{ color: T.gold }}>${data.total}</span></span>
        <span style={{ fontSize: 10, color: T.mint }}>${data.perPerson}/person</span>
      </div>
    </div>
  );
}

function ChecklistCard({ data }) {
  return (
    <div style={{ borderRadius: 14, overflow: "hidden", width: 250, background: "rgba(255,255,255,0.05)", border: "1px solid " + T.glassBorder }}>
      <div style={{ padding: "7px 11px", background: T.lime + "12", borderBottom: "1px solid " + T.glassBorder }}>
        <span style={{ fontSize: 11, fontWeight: 600 }}>✅ {data.title}</span>
      </div>
      <div style={{ padding: "4px 10px" }}>
        {(data.items || []).map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 0" }}>
            <span style={{ fontSize: 11 }}>{item.done ? "✅" : "⬜"}</span>
            <span style={{ fontSize: 10, color: item.done ? T.ash : T.white, textDecoration: item.done ? "line-through" : "none" }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShareSheet({ onClose, onShare }) {
  const [selected, setSelected] = useState(null);
  const [fd, setFd] = useState({ airline: "", flight_number: "", from: "", fromCity: "", to: "", toCity: "", price: "", date: "", duration: "" });
  const [pd, setPd] = useState({ question: "", options: ["", ""] });
  const [cd, setCd] = useState({ title: "", items: ["", ""] });
  const inp = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid " + T.glassBorder, background: T.glass, color: T.white, fontSize: 12, outline: "none", marginBottom: 7 };

  function submit() {
    if (selected === "flight") onShare("flight", { ...fd, price: parseFloat(fd.price) || 0, status: "found" });
    else if (selected === "poll") onShare("poll", { question: pd.question, options: pd.options.filter(o => o.trim()).map((o, i) => ({ id: "o" + i, text: o, votes: [] })), totalVotes: 0 });
    else if (selected === "checklist") onShare("checklist", { title: cd.title || "Checklist", items: cd.items.filter(i => i.trim()).map(i => ({ text: i, done: false })) });
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, animation: "fadeIn .2s" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", background: T.ink, borderRadius: "20px 20px 0 0", padding: "14px 16px 28px", animation: "slideUp .3s cubic-bezier(0.34,1.56,0.64,1)", maxHeight: "75vh", overflow: "auto" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: T.slate, margin: "0 auto 14px" }} />
        {!selected ? (
          <>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, marginBottom: 12 }}>Share to Chat</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {SHARE_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => setSelected(opt.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "12px 6px", borderRadius: 14, border: "1px solid " + T.glassBorder, background: T.glass, cursor: "pointer" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: opt.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{opt.icon}</div>
                  <span style={{ fontSize: 9, color: T.mist }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : selected === "flight" ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: T.mist, fontSize: 16, cursor: "pointer" }}>←</button>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17 }}>✈️ Share Flight</h3>
            </div>
            <input style={inp} placeholder="Airline" value={fd.airline} onChange={e => setFd({ ...fd, airline: e.target.value })} />
            <input style={inp} placeholder="Flight # (e.g. SQ 726)" value={fd.flight_number} onChange={e => setFd({ ...fd, flight_number: e.target.value })} />
            <div style={{ display: "flex", gap: 6 }}>
              <input style={{ ...inp, flex: 1 }} placeholder="From (CDG)" value={fd.from} onChange={e => setFd({ ...fd, from: e.target.value })} />
              <input style={{ ...inp, flex: 1 }} placeholder="To (DPS)" value={fd.to} onChange={e => setFd({ ...fd, to: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input style={{ ...inp, flex: 1 }} placeholder="Date (Mar 15)" value={fd.date} onChange={e => setFd({ ...fd, date: e.target.value })} />
              <input style={{ ...inp, flex: 1 }} placeholder="Price ($)" type="number" value={fd.price} onChange={e => setFd({ ...fd, price: e.target.value })} />
            </div>
            <PrimaryBtn onClick={submit}>Share Flight ✈️</PrimaryBtn>
          </>
        ) : selected === "poll" ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: T.mist, fontSize: 16, cursor: "pointer" }}>←</button>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17 }}>📊 Create Poll</h3>
            </div>
            <input style={inp} placeholder="Question..." value={pd.question} onChange={e => setPd({ ...pd, question: e.target.value })} />
            {pd.options.map((o, i) => <input key={i} style={inp} placeholder={`Option ${i + 1}`} value={o} onChange={e => { const opts = [...pd.options]; opts[i] = e.target.value; setPd({ ...pd, options: opts }); }} />)}
            <button onClick={() => setPd({ ...pd, options: [...pd.options, ""] })} style={{ background: "none", border: "none", color: T.violet, fontSize: 11, cursor: "pointer", marginBottom: 6 }}>+ Add option</button>
            <PrimaryBtn onClick={submit} style={{ background: `linear-gradient(135deg,${T.violet},${T.electric})` }}>Share Poll 📊</PrimaryBtn>
          </>
        ) : selected === "checklist" ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: T.mist, fontSize: 16, cursor: "pointer" }}>←</button>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17 }}>✅ Create Checklist</h3>
            </div>
            <input style={inp} placeholder="Title..." value={cd.title} onChange={e => setCd({ ...cd, title: e.target.value })} />
            {cd.items.map((item, i) => <input key={i} style={inp} placeholder={`Item ${i + 1}`} value={item} onChange={e => { const items = [...cd.items]; items[i] = e.target.value; setCd({ ...cd, items }); }} />)}
            <button onClick={() => setCd({ ...cd, items: [...cd.items, ""] })} style={{ background: "none", border: "none", color: T.lime, fontSize: 11, cursor: "pointer", marginBottom: 6 }}>+ Add item</button>
            <PrimaryBtn onClick={submit} style={{ background: `linear-gradient(135deg,${T.mint},${T.lime})`, color: T.midnight }}>Share Checklist ✅</PrimaryBtn>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: T.mist, fontSize: 16, cursor: "pointer" }}>←</button>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17 }}>Coming Soon</h3>
            </div>
            <p style={{ color: T.ash, fontSize: 12 }}>This feature is coming in the next update!</p>
          </>
        )}
      </div>
    </div>
  );
}

function ChatDetail({ match, userId, onBack }) {
  const conversationId = isDemo ? null : (match.id || match.conversation_id);
  const chatHook = useChat(conversationId, userId);
  const [demoMessages, setDemoMessages] = useState([
    { id: 1, from: "them", type: "text", text: `Heyy! So excited about ${match.destination || match.shared_destination || "our trip"}! ${match.destEmoji || match.destination_emoji || "🌍"}`, time: "2:30 PM" },
    { id: 2, from: "me", type: "text", text: "Sameee! I've been looking at flights already ✈️", time: "2:31 PM" },
  ]);
  const [input, setInput] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [typing, setTypingState] = useState(false);
  const scrollRef = useRef(null);

  const messages = isDemo ? demoMessages : chatHook.messages;
  const isTyping = isDemo ? typing : chatHook.typingUsers.length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  async function send() {
    if (!input.trim()) return;
    if (isDemo) {
      setDemoMessages(p => [...p, { id: Date.now(), from: "me", type: "text", text: input.trim(), time: "Now" }]);
      setInput("");
      setTypingState(true);
      setTimeout(() => {
        setTypingState(false);
        setDemoMessages(p => [...p, { id: Date.now() + 1, from: "them", type: "text", text: REPLIES[Math.floor(Math.random() * REPLIES.length)], time: "Now" }]);
      }, 1400 + Math.random() * 1200);
    } else {
      await chatHook.sendMessage(input.trim());
      setInput("");
    }
  }

  function handleShare(type, data) {
    if (isDemo) {
      setDemoMessages(p => [...p, { id: Date.now(), from: "me", type, time: "Now", data }]);
      setTypingState(true);
      const reactions = { flight: "Great find! ✈️", poll: "Voted! 📊", checklist: "Nice list! ✅", itinerary: "Love this! 📋", expense: "Looks good! 💰" };
      setTimeout(() => {
        setTypingState(false);
        setDemoMessages(p => [...p, { id: Date.now() + 1, from: "them", type: "text", text: reactions[type] || "Nice share! 🔥", time: "Now" }]);
      }, 2000);
    } else {
      chatHook.sendMessage(JSON.stringify(data), type, data);
    }
  }

  function handleVote(optId) {
    setDemoMessages(prev => prev.map(m => {
      if (m.type !== "poll") return m;
      return { ...m, data: { ...m.data, options: m.data.options.map(o => o.id !== optId ? { ...o, votes: (o.votes || []).filter(v => v !== "me") } : { ...o, votes: (o.votes || []).includes("me") ? (o.votes || []).filter(v => v !== "me") : [...(o.votes || []), "me"] }) } };
    }));
  }

  function renderMsg(msg) {
    const isMine = isDemo ? msg.from === "me" : msg.sender_id === userId;
    const msgContent = msg.text || msg.content || "";
    const msgType = msg.type || "text";
    const msgData = msg.data || msg.metadata || {};
    const msgTime = msg.time || (msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

    return (
      <div key={msg.id} style={{ alignSelf: isMine ? "flex-end" : "flex-start", maxWidth: "82%", animation: (isMine ? "slideInR" : "slideInL") + " .3s ease both" }}>
        {!isMine && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>{match.avatar || "😎"}</div>
            <span style={{ fontSize: 8, color: T.ash }}>{match.name || msg.sender?.name || ""}</span>
          </div>
        )}
        <div style={{ marginLeft: isMine ? 0 : 23 }}>
          {msgType === "text" ? (
            <div style={{ padding: "9px 13px", borderRadius: 16, background: isMine ? `linear-gradient(135deg,${T.flame},${T.sunset})` : T.slate, borderBottomRightRadius: isMine ? 4 : 16, borderBottomLeftRadius: isMine ? 16 : 4 }}>
              <p style={{ fontSize: 13, lineHeight: 1.5 }}>{msgContent}</p>
            </div>
          ) : msgType === "flight" ? <FlightCard data={msgData} isMine={isMine} />
            : msgType === "poll" ? <PollCard data={msgData} onVote={handleVote} />
              : msgType === "itinerary" ? <ItineraryCard data={msgData} />
                : msgType === "expense" ? <ExpenseCard data={msgData} />
                  : msgType === "checklist" ? <ChecklistCard data={msgData} />
                    : (
                      <div style={{ padding: "9px 13px", borderRadius: 16, background: T.slate }}>
                        <p style={{ fontSize: 13, lineHeight: 1.5 }}>{msgContent}</p>
                      </div>
                    )}
        </div>
        <span style={{ fontSize: 8, color: T.ash, display: "block", marginTop: 2, textAlign: isMine ? "right" : "left", paddingLeft: isMine ? 0 : 23 }}>{msgTime}</span>
      </div>
    );
  }

  const matchName = match.name || "Chat";
  const matchAvatar = match.avatar || "😎";
  const matchDest = match.destination || match.shared_destination || "";
  const matchDestEmoji = match.destEmoji || match.destination_emoji || "🌍";
  const matchDates = match.dates || match.date_display || "";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: T.midnight, display: "flex", flexDirection: "column", animation: "slideInR .25s ease", maxWidth: 420, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 14px 10px", borderBottom: "1px solid " + T.glass, background: `linear-gradient(to bottom,${T.ink},${T.midnight})`, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: T.white, fontSize: 20, cursor: "pointer" }}>←</button>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{matchAvatar}</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>{matchName}</h3>
          <span style={{ fontSize: 10, color: T.mint }}>● Online</span>
        </div>
        <div style={{ background: `linear-gradient(135deg,${T.flame}33,${T.sunset}33)`, borderRadius: 10, padding: "4px 9px" }}>
          <span style={{ fontSize: 10 }}>{matchDestEmoji} {matchDest}</span>
        </div>
      </div>

      {/* Trip banner */}
      <div style={{ margin: "8px 14px", padding: "7px 11px", borderRadius: 10, background: `linear-gradient(135deg,${T.flame}12,${T.sunset}08)`, border: `1px solid ${T.flame}25`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span>🗺️</span>
        <span style={{ fontSize: 11, fontWeight: 600 }}>Trip to {matchDest}</span>
        <span style={{ fontSize: 10, color: T.ash }}>{matchDates}</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: "6px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
        {messages.map(renderMsg)}
        {isTyping && (
          <div style={{ alignSelf: "flex-start", animation: "fadeIn .3s" }}>
            <div style={{ background: T.slate, borderRadius: "16px 16px 16px 4px", padding: "9px 16px", display: "flex", gap: 4, marginLeft: 23 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: T.mist, animation: `typing 1.2s ease ${i * .2}s infinite` }} />)}
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div style={{ padding: "9px 14px 13px", display: "flex", gap: 8, alignItems: "center", borderTop: "1px solid " + T.glass, background: `linear-gradient(to top,${T.ink},${T.midnight})`, flexShrink: 0 }}>
        <button onClick={() => setShowShare(true)} style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: `linear-gradient(135deg,${T.flame}22,${T.sunset}22)`, color: T.coral, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>+</button>
        <input value={input} onChange={e => { setInput(e.target.value); if (!isDemo && chatHook.sendTyping) chatHook.sendTyping(true); }} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message..." style={{ flex: 1, padding: "10px 14px", borderRadius: 20, background: T.glass, border: "1px solid " + T.glassBorder, color: T.white, fontSize: 13, outline: "none" }} />
        <button onClick={send} style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: input.trim() ? `linear-gradient(135deg,${T.flame},${T.sunset})` : T.slate, color: T.white, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>↑</button>
      </div>

      {showShare && <ShareSheet onClose={() => setShowShare(false)} onShare={handleShare} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TRIPS SCREEN
// ══════════════════════════════════════════════════════════════
function TripsScreen({ matches, userId }) {
  const tripsHook = useTrips(isDemo ? null : userId);
  const [demoTrips, setDemoTrips] = useState([
    { id: "t1", destination: "Bali", flag: "🇮🇩", dates: "Mar 15 – Apr 2", status: "planning", buddy: matches[0] || null, items: [{ text: "Book flights", done: true }, { text: "Reserve villa", done: true }, { text: "Yoga retreat", done: false }, { text: "Volcano trek", done: false }] },
  ]);
  const [expanded, setExpanded] = useState(null);
  const [newItem, setNewItem] = useState("");
  const [budgets, setBudgets] = useState({});
  const [expenses, setExpenses] = useState({});

  const trips = isDemo ? demoTrips : (tripsHook.trips || []);

  function toggleItem(tripId, idx) {
    if (isDemo) setDemoTrips(p => p.map(t => t.id === tripId ? { ...t, items: t.items.map((item, i) => i === idx ? { ...item, done: !item.done } : item) } : t));
  }

  function addItem(tripId) {
    if (!newItem.trim()) return;
    if (isDemo) setDemoTrips(p => p.map(t => t.id === tripId ? { ...t, items: [...t.items, { text: newItem.trim(), done: false }] } : t));
    setNewItem("");
  }

  function addExpense(tripId) {
    const defaults = [
      { icon: "✈️", label: "Flights", amount: "340" },
      { icon: "🏨", label: "Accommodation", amount: "180" },
      { icon: "🍜", label: "Food", amount: "45" },
      { icon: "🎯", label: "Activities", amount: "80" },
    ];
    const ex = expenses[tripId] || [];
    const pick = defaults[ex.length % defaults.length];
    setExpenses(p => ({ ...p, [tripId]: [...(p[tripId] || []), pick] }));
  }

  if (expanded) {
    const trip = trips.find(t => t.id === expanded);
    if (!trip) return null;
    const items = trip.items || [];
    const done = items.filter(i => i.done).length;
    const budget = budgets[trip.id] || { total: "", currency: "USD" };
    const tripExpenses = expenses[trip.id] || [];
    const totalSpent = tripExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

    return (
      <div style={{ flex: 1, overflow: "auto", padding: "0 16px 16px", animation: "fadeIn .3s" }}>
        <button onClick={() => setExpanded(null)} style={{ background: "none", border: "none", color: T.mist, fontSize: 13, cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", gap: 5, padding: "14px 0 0" }}>← Back</button>

        {/* Trip header */}
        <Glass style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 28 }}>{trip.flag || trip.destination_emoji || "🌍"}</span>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22 }}>{trip.destination}</h2>
              <p style={{ color: T.ash, fontSize: 11 }}>{trip.dates || trip.date_display || ""}</p>
            </div>
            <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, background: T.mint + "22", color: T.mint, textTransform: "capitalize" }}>{trip.status}</span>
          </div>
          {items.length > 0 && (
            <>
              <div style={{ height: 5, borderRadius: 3, background: T.slate, marginTop: 10 }}>
                <div style={{ height: "100%", borderRadius: 3, width: (done / items.length * 100) + "%", background: `linear-gradient(90deg,${T.mint},${T.lime})`, transition: "width .4s" }} />
              </div>
              <div style={{ fontSize: 10, color: T.ash, marginTop: 4 }}>{done}/{items.length} completed</div>
            </>
          )}
        </Glass>

        {/* Checklist */}
        <SectionLabel>Checklist</SectionLabel>
        {items.map((item, idx) => (
          <div key={idx} onClick={() => toggleItem(trip.id, idx)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12, background: T.glass, border: "1px solid " + T.glassBorder, marginBottom: 7, cursor: "pointer", transition: "all .2s" }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${item.done ? T.mint : T.slate}`, background: item.done ? T.mint : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", flexShrink: 0 }}>
              {item.done && <span style={{ fontSize: 10, color: T.midnight }}>✓</span>}
            </div>
            <span style={{ fontSize: 13, color: item.done ? T.ash : T.white, textDecoration: item.done ? "line-through" : "none", transition: "all .2s" }}>{item.text}</span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem(trip.id)} placeholder="Add a task..." style={{ flex: 1, padding: "10px 14px", borderRadius: 12, background: T.glass, border: "1px solid " + T.glassBorder, color: T.white, fontSize: 12, outline: "none" }} />
          <button onClick={() => addItem(trip.id)} style={{ padding: "10px 16px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${T.flame},${T.sunset})`, color: T.white, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Add</button>
        </div>

        {/* Budget Tracker */}
        <SectionLabel>Budget Tracker</SectionLabel>
        <Glass style={{ padding: 16, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: T.ash, marginBottom: 4 }}>Total Budget (USD)</p>
              <input type="number" placeholder="e.g. 2000" value={budget.total}
                onChange={e => setBudgets(p => ({ ...p, [trip.id]: { total: e.target.value, currency: "USD" } }))}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid " + T.glassBorder, background: T.glass, color: T.white, fontSize: 13, outline: "none", colorScheme: "dark" }} />
            </div>
            {budget.total && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: T.ash }}>Spent</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: totalSpent > parseFloat(budget.total) ? T.rose : T.mint }}>${totalSpent.toFixed(0)}</div>
              </div>
            )}
          </div>
          {budget.total && (
            <>
              <div style={{ height: 5, borderRadius: 3, background: T.slate }}>
                <div style={{ height: "100%", borderRadius: 3, width: Math.min(100, totalSpent / parseFloat(budget.total) * 100).toFixed(0) + "%", background: `linear-gradient(90deg,${T.mint},${totalSpent > parseFloat(budget.total) ? T.rose : T.lime})`, transition: "width .5s" }} />
              </div>
              <div style={{ fontSize: 10, color: T.ash, marginTop: 5 }}>${(parseFloat(budget.total) - totalSpent).toFixed(0)} remaining</div>
            </>
          )}
        </Glass>

        {tripExpenses.map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 12, background: T.glass, border: "1px solid " + T.glassBorder, marginBottom: 6 }}>
            <span style={{ fontSize: 18 }}>{e.icon || "💸"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{e.label}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>${e.amount}</div>
            <button onClick={() => setExpenses(p => { const ex = [...(p[trip.id] || [])]; ex.splice(i, 1); return { ...p, [trip.id]: ex }; })} style={{ background: "none", border: "none", color: T.ash, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        ))}

        <button onClick={() => addExpense(trip.id)} style={{ width: "100%", padding: "10px", borderRadius: 12, border: "1px dashed " + T.glassBorder, background: "transparent", color: T.mist, fontSize: 12, cursor: "pointer", marginTop: 4 }}>+ Add Expense</button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "14px 16px 8px", flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900 }}>My Trips</h2>
          <p style={{ fontSize: 11, color: T.ash, marginTop: 2 }}>{trips.length} adventures planned</p>
        </div>
        <button onClick={() => showToast({ icon: "➕", title: "New Trip", body: "Full trip planner coming soon!", color: `rgba(255,184,48,.9)` })} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid " + T.glassBorder, background: T.glass, color: T.white, fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "0 16px 16px" }}>
        {trips.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🗺️</div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20 }}>No trips yet</h3>
            <p style={{ color: T.ash, fontSize: 12, marginTop: 6 }}>Match with travelers and start planning!</p>
          </div>
        ) : trips.map(trip => {
          const done = trip.items.filter(i => i.done).length;
          const pct = trip.items.length ? Math.round(done / trip.items.length * 100) : 0;
          return (
            <div key={trip.id} onClick={() => setExpanded(trip.id)} style={{ borderRadius: 18, overflow: "hidden", marginBottom: 12, background: `linear-gradient(135deg,${T.charcoal},${T.ink})`, border: "1px solid " + T.glassBorder, cursor: "pointer", transition: "transform .2s" }}>
              <div style={{ padding: "16px 16px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 32 }}>{trip.flag}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>{trip.destination}</div>
                    <div style={{ fontSize: 11, color: T.ash, marginTop: 1 }}>{trip.dates}</div>
                  </div>
                  <div style={{ padding: "4px 10px", borderRadius: 8, fontSize: 9, fontWeight: 600, background: T.mint + "18", color: T.mint, textTransform: "capitalize" }}>{trip.status}</div>
                </div>
                {trip.buddy && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, padding: "6px 10px", background: T.glass, borderRadius: 10, border: "1px solid " + T.glassBorder }}>
                    <span style={{ fontSize: 16 }}>{trip.buddy.avatar}</span>
                    <span style={{ fontSize: 11, color: T.mist }}>Traveling with <strong style={{ color: T.white }}>{trip.buddy.name}</strong></span>
                  </div>
                )}
                <div style={{ height: 4, borderRadius: 2, background: T.slate }}>
                  <div style={{ height: "100%", borderRadius: 2, width: pct + "%", background: `linear-gradient(90deg,${T.mint},${T.lime})`, transition: "width .5s" }} />
                </div>
                <div style={{ fontSize: 10, color: T.ash, marginTop: 4 }}>{done}/{trip.items.length} tasks · {pct}% ready</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PROFILE SCREEN
// ══════════════════════════════════════════════════════════════
function ProfileScreen({ user, userProfile, onUpdateProfile }) {
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || "Alex");
  const [editCity, setEditCity] = useState(userProfile?.city || "Paris");
  const [editAvatar, setEditAvatar] = useState(user?.avatar || "😎");
  const [localProfile, setLocalProfile] = useState({
    vibe: userProfile?.vibe || "Adventurous",
    budget: userProfile?.budget || "Mid-range",
    interests: userProfile?.interests || ["Hiking", "Food", "Photography"],
  });

  const AVATAR_OPTIONS = ["😎", "🧕", "👨🏾", "👩🏽", "🧑🏻", "👩🏼", "🧔", "🧑🏿", "🧝", "🧜"];

  function saveProfile() {
    setEditOpen(false);
    showToast({ icon: "✅", title: "Profile saved!", body: "Looking great!", color: `rgba(0,212,170,.9)` });
    if (onUpdateProfile) onUpdateProfile({ ...localProfile, name: editName, city: editCity, avatar: editAvatar });
  }

  function toggleInterest(i) {
    setLocalProfile(p => ({
      ...p,
      interests: p.interests.includes(i) ? p.interests.filter(x => x !== i) : [...p.interests, i],
    }));
  }

  return (
    <div style={{ flex: 1, overflow: "auto" }}>
      {/* Cover */}
      <div style={{ position: "relative", height: 180, background: `linear-gradient(135deg,${T.flame}40,${T.sunset}30,${T.violet}20)`, flexShrink: 0 }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom,transparent 40%,${T.midnight})` }} />
        <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", alignItems: "flex-end", gap: 12 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", border: `3px solid ${T.flame}`, background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, animation: "pulse 3s ease infinite" }}>{editAvatar}</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700 }}>{editName}</div>
            <div style={{ fontSize: 11, color: T.mist }}>📍 {editCity}</div>
          </div>
        </div>
        <button onClick={() => setEditOpen(true)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,.45)", backdropFilter: "blur(10px)", border: "1px solid " + T.glassBorder, borderRadius: 10, color: T.white, fontSize: 12, padding: "5px 12px", cursor: "pointer" }}>Edit</button>
      </div>

      <div style={{ padding: "14px 16px 32px" }}>
        {/* Stats */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {[{ label: "Countries", val: 4, color: T.violet }, { label: "Trips", val: 1, color: T.mint }, { label: "Matches", val: 0, color: T.flame }].map(s => (
            <div key={s.label} style={{ flex: 1, padding: "12px", borderRadius: 14, background: T.glass, border: "1px solid " + T.glassBorder, textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: T.ash, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Vibe */}
        <SectionLabel>My Vibe</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {VIBES.map(v => (
            <div key={v} onClick={() => { setLocalProfile(p => ({ ...p, vibe: v })); showToast({ icon: "🎭", title: "Vibe: " + v, color: `rgba(255,65,54,.9)` }); }}
              style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${v === localProfile.vibe ? T.flame : T.glassBorder}`, background: v === localProfile.vibe ? T.flame + "22" : T.glass, color: v === localProfile.vibe ? T.coral : T.mist, fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}>
              {v}
            </div>
          ))}
        </div>

        {/* Budget */}
        <SectionLabel>Travel Budget</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {BUDGETS.map(b => (
            <div key={b} onClick={() => { setLocalProfile(p => ({ ...p, budget: b })); showToast({ icon: "💰", title: "Budget: " + b, color: `rgba(255,184,48,.9)` }); }}
              style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${b === localProfile.budget ? T.gold : T.glassBorder}`, background: b === localProfile.budget ? T.gold + "22" : T.glass, color: b === localProfile.budget ? T.gold : T.mist, fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}>
              {b}
            </div>
          ))}
        </div>

        {/* Interests */}
        <SectionLabel>Interests</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 20 }}>
          {ALL_INTERESTS.map(i => {
            const sel = localProfile.interests.includes(i);
            return (
              <div key={i} onClick={() => toggleInterest(i)} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${sel ? T.violet : T.glassBorder}`, background: sel ? T.violet + "22" : T.glass, color: sel ? T.violet : T.mist, fontSize: 11, cursor: "pointer", transition: "all .2s" }}>
                {i}
              </div>
            );
          })}
        </div>

        <SecondaryBtn style={{ marginBottom: 8 }} onClick={() => showToast({ icon: "🔔", title: "Notification settings", body: "Coming soon!", color: "rgba(91,91,255,.95)" })}>🔔 Notification Settings</SecondaryBtn>
        <SecondaryBtn onClick={() => showToast({ icon: "🔐", title: "Privacy & Safety", body: "Coming soon!", color: "rgba(30,30,50,.97)" })}>🔐 Privacy & Safety</SecondaryBtn>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: T.ink, borderRadius: "24px 24px 0 0", padding: "20px 16px 28px", width: "100%", maxWidth: 420, maxHeight: "70vh", overflowY: "auto", animation: "slideUp .3s ease" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: T.slate, margin: "0 auto 16px" }} />
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Edit Profile</h3>
            <SectionLabel>Name</SectionLabel>
            <input value={editName} onChange={e => setEditName(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid " + T.glassBorder, background: T.glass, color: T.white, fontSize: 13, outline: "none", marginBottom: 12 }} placeholder="Your name" />
            <SectionLabel>City</SectionLabel>
            <input value={editCity} onChange={e => setEditCity(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid " + T.glassBorder, background: T.glass, color: T.white, fontSize: 13, outline: "none", marginBottom: 14 }} placeholder="Your city" />
            <SectionLabel>Avatar</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {AVATAR_OPTIONS.map(a => (
                <div key={a} onClick={() => setEditAvatar(a)} style={{ width: 42, height: 42, borderRadius: 10, background: T.glass, border: `2px solid ${a === editAvatar ? T.flame : T.glassBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, cursor: "pointer", transition: "border .2s" }}>{a}</div>
              ))}
            </div>
            <PrimaryBtn onClick={saveProfile}>Save Changes</PrimaryBtn>
            <SecondaryBtn style={{ marginTop: 8 }} onClick={() => setEditOpen(false)}>Cancel</SecondaryBtn>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════
export default function App() {
  const auth = useAuth();
  const profile = useProfile(auth.user?.id);
  const [tab, setTab] = useState("discover");
  const [matches, setMatches] = useState([]);
  const [matchOverlay, setMatchOverlay] = useState(null);
  const [openChat, setOpenChat] = useState(null);

  // Inject CSS
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  if (auth.loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.midnight }}>
        <div style={{ textAlign: "center", animation: "fadeIn .5s ease" }}>
          <div style={{ fontSize: 48, animation: "float 3s ease-in-out infinite", marginBottom: 12 }}>✈️</div>
          <p style={{ color: T.ash, fontSize: 12, letterSpacing: 3, textTransform: "uppercase" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!auth.user) return <AuthScreen onLogin={user => auth.signIn ? auth.setUser(user) : null} />;

  function handleMatch(traveler) {
    setMatches(p => {
      if (p.find(m => m.id === traveler.id)) return p;
      return [...p, traveler];
    });
    setMatchOverlay(traveler);
  }

  function handleOpenChat(match) {
    setOpenChat(match);
    setTab("chats");
  }

  const screens = {
    discover: (
      <DiscoverScreen
        onMatch={handleMatch}
        matches={matches}
        userId={auth.user?.id}
        userProfile={profile.profile}
      />
    ),
    explore: <ExploreScreen />,
    chats: (
      <ChatsListScreen
        matches={matches}
        userId={auth.user?.id}
        onOpenChat={handleOpenChat}
      />
    ),
    trips: <TripsScreen matches={matches} userId={auth.user?.id} />,
    profile: (
      <ProfileScreen
        user={auth.user}
        userProfile={profile.profile}
        onUpdateProfile={profile.updateProfile}
      />
    ),
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto", overflow: "hidden", position: "relative" }}>
      <ToastContainer />

      {/* Active screen */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {screens[tab]}
      </div>

      {/* Tab bar */}
      <TabBar tab={tab} onTab={t => { setTab(t); setOpenChat(null); }} matchCount={matches.length} />

      {/* Match overlay */}
      {matchOverlay && (
        <MatchOverlay
          match={matchOverlay}
          userAvatar={auth.user?.avatar || "😎"}
          onMessage={() => { setMatchOverlay(null); handleOpenChat(matchOverlay); }}
          onClose={() => setMatchOverlay(null)}
        />
      )}

      {/* Chat detail */}
      {openChat && (
        <ChatDetail
          match={openChat}
          userId={auth.user?.id}
          onBack={() => setOpenChat(null)}
        />
      )}
    </div>
  );
}
