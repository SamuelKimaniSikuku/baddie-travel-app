import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

// ═══════════════════════════════════════════════════════════════
// BADDIE — Premium Features: Auth + Notifications + Payments
// ═══════════════════════════════════════════════════════════════

const T = {
  flame:"#FF4136",coral:"#FF6B5A",sunset:"#FF8C42",gold:"#FFB830",
  midnight:"#0A0A14",ink:"#14142B",charcoal:"#1E1E32",slate:"#2D2D48",
  ash:"#6E6E8A",mist:"#A0A0BE",white:"#FFFFFF",mint:"#00D4AA",
  electric:"#5B5BFF",rose:"#FF3B6F",sky:"#38BDF8",violet:"#A78BFA",
  lime:"#84CC16",glass:"rgba(255,255,255,0.06)",glassBorder:"rgba(255,255,255,0.1)",
};

// ══════════════════════════════════════════════════════════════
// 1. GOOGLE / APPLE SIGN IN
// ══════════════════════════════════════════════════════════════
export function SocialAuthButtons({ onSuccess, mode = "signin" }) {
  const [loading, setLoading] = useState(null);

  async function signInWithGoogle() {
    setLoading("google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) { console.error(error); setLoading(null); }
  }

  async function signInWithApple() {
    setLoading("apple");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: window.location.origin },
    });
    if (error) { console.error(error); setLoading(null); }
  }

  const btnStyle = (bg, color, border) => ({
    width: "100%", padding: "13px 16px", borderRadius: 14,
    border: `1px solid ${border || T.glassBorder}`,
    background: bg, color, fontSize: 14, fontWeight: 600,
    cursor: "pointer", display: "flex", alignItems: "center",
    justifyContent: "center", gap: 10, transition: "all .2s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
        <div style={{ flex: 1, height: 1, background: T.glassBorder }} />
        <span style={{ fontSize: 11, color: T.ash }}>or continue with</span>
        <div style={{ flex: 1, height: 1, background: T.glassBorder }} />
      </div>

      {/* Google */}
      <button onClick={signInWithGoogle} disabled={!!loading} style={btnStyle(T.white, "#1a1a1a", "#ddd")}>
        {loading === "google" ? (
          <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #ddd", borderTopColor: T.flame, animation: "spin 1s linear infinite" }} />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        {loading === "google" ? "Connecting..." : `${mode === "signup" ? "Sign up" : "Sign in"} with Google`}
      </button>

      {/* Apple */}
      <button onClick={signInWithApple} disabled={!!loading} style={btnStyle("#000", "#fff", "#333")}>
        {loading === "apple" ? (
          <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #444", borderTopColor: T.white, animation: "spin 1s linear infinite" }} />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
        )}
        {loading === "apple" ? "Connecting..." : `${mode === "signup" ? "Sign up" : "Sign in"} with Apple`}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 2. PUSH NOTIFICATIONS
// ══════════════════════════════════════════════════════════════
export function useNotifications(userId) {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (permission === "granted") setEnabled(true);
  }, [permission]);

  async function requestPermission() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      setEnabled(true);
      await saveToken(userId);
    }
    return result;
  }

  async function saveToken(uid) {
    // For web push, we use the Notification API directly
    // For production, integrate with FCM or OneSignal
    try {
      const registration = await navigator.serviceWorker.ready;
      // Save a placeholder token - in production replace with real FCM token
      const token = `web_${uid}_${Date.now()}`;
      await supabase.from("push_tokens").upsert({
        user_id: uid, token, platform: "web",
      }, { onConflict: "user_id,token" });
    } catch (e) {
      console.log("SW not available:", e.message);
    }
  }

  function sendLocalNotification(title, body, icon = "✈️") {
    if (permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico", badge: "/favicon.ico" });
    }
  }

  return { permission, enabled, requestPermission, sendLocalNotification };
}

export function NotificationSettings({ userId, profile, onUpdate }) {
  const { permission, enabled, requestPermission } = useNotifications(userId);
  const [prefs, setPrefs] = useState({
    notif_matches:   profile?.notif_matches   ?? true,
    notif_messages:  profile?.notif_messages  ?? true,
    notif_trips:     profile?.notif_trips     ?? true,
    notif_marketing: profile?.notif_marketing ?? false,
  });
  const [saving, setSaving] = useState(false);

  async function togglePref(key) {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    await supabase.from("profiles").update(updated).eq("id", userId);
    setSaving(false);
    onUpdate?.(updated);
  }

  const notifItems = [
    { key: "notif_matches",   icon: "❤️", label: "New matches",       desc: "When someone matches with you" },
    { key: "notif_messages",  icon: "💬", label: "Messages",           desc: "New messages from travel buddies" },
    { key: "notif_trips",     icon: "✈️", label: "Trip updates",       desc: "Changes to your planned trips" },
    { key: "notif_marketing", icon: "🌍", label: "Travel inspiration", desc: "Destination tips and offers" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Notifications</h3>
        <p style={{ fontSize: 11, color: T.ash }}>Stay updated on your travel connections</p>
      </div>

      {/* Permission banner */}
      {permission !== "granted" && (
        <div style={{ padding: "14px 16px", borderRadius: 14, background: T.flame + "15", border: `1px solid ${T.flame}33`, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 24 }}>🔔</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600 }}>Enable push notifications</p>
              <p style={{ fontSize: 11, color: T.ash, marginTop: 2 }}>Get notified instantly when you match or receive messages</p>
            </div>
          </div>
          <button onClick={requestPermission} style={{ width: "100%", padding: "10px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${T.flame},${T.sunset})`, color: T.white, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {permission === "denied" ? "Enable in Browser Settings" : "Allow Notifications 🔔"}
          </button>
          {permission === "denied" && (
            <p style={{ fontSize: 10, color: T.ash, marginTop: 8, textAlign: "center" }}>Go to browser Settings → Notifications → Allow baddies.travel</p>
          )}
        </div>
      )}

      {permission === "granted" && (
        <div style={{ padding: "8px 12px", borderRadius: 10, background: T.mint + "15", border: `1px solid ${T.mint}33`, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>✅</span>
          <span style={{ fontSize: 11, color: T.mint, fontWeight: 600 }}>Push notifications enabled</span>
        </div>
      )}

      {/* Notification toggles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {notifItems.map(item => (
          <div key={item.key} onClick={() => togglePref(item.key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: T.glass, border: "1px solid " + T.glassBorder, cursor: "pointer" }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</p>
              <p style={{ fontSize: 10, color: T.ash, marginTop: 2 }}>{item.desc}</p>
            </div>
            {/* Toggle */}
            <div style={{ width: 44, height: 24, borderRadius: 12, background: prefs[item.key] ? T.flame : T.slate, position: "relative", transition: "background .2s", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 3, left: prefs[item.key] ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: T.white, transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.3)" }} />
            </div>
          </div>
        ))}
      </div>
      {saving && <p style={{ fontSize: 10, color: T.ash, textAlign: "center", marginTop: 8 }}>Saving...</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 3. PREMIUM PLANS (Paywall)
// ══════════════════════════════════════════════════════════════
const PLANS = [
  {
    id: "free",
    name: "Explorer",
    price: 0,
    period: "forever",
    color: T.ash,
    icon: "🎒",
    features: [
      "10 swipes per day",
      "3 super likes per day",
      "Basic matching",
      "1 active trip",
      "Standard support",
    ],
    missing: ["See who liked you", "Unlimited swipes", "Priority in discovery", "AI trip planner", "Verified badge boost"],
  },
  {
    id: "plus",
    name: "Nomad",
    price: 9.99,
    period: "month",
    color: T.sunset,
    icon: "✈️",
    popular: true,
    features: [
      "Unlimited swipes",
      "10 super likes per day",
      "See who liked you",
      "5 active trips",
      "AI trip planner",
      "Priority support",
      "Passport mode (travel anywhere)",
    ],
    missing: ["Profile boost", "Incognito mode"],
  },
  {
    id: "pro",
    name: "Baddie Pro",
    price: 19.99,
    period: "month",
    color: T.gold,
    icon: "👑",
    features: [
      "Everything in Nomad",
      "Unlimited super likes",
      "1 weekly profile boost",
      "Incognito mode",
      "Unlimited trips",
      "Priority discovery",
      "Dedicated support",
      "Early access to features",
    ],
    missing: [],
  },
];

export function PremiumPaywall({ currentPlan = "free", userId, onUpgrade, onClose }) {
  const [selected, setSelected] = useState("plus");
  const [billing, setBilling] = useState("monthly"); // monthly | yearly
  const [loading, setLoading] = useState(false);

  const discount = 0.35; // 35% off yearly
  const yearlyPrice = (p) => (p * 12 * (1 - discount)).toFixed(2);

  async function handleUpgrade() {
    setLoading(true);
    try {
      // In production: call your Stripe endpoint
      // const { data } = await supabase.functions.invoke('create-checkout', {
      //   body: { plan: selected, billing, userId }
      // });
      // window.location.href = data.url;

      // Demo: simulate upgrade
      await new Promise(r => setTimeout(r, 1500));
      await supabase.from("subscriptions").upsert({
        user_id: userId,
        plan: selected,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: "user_id" });
      await supabase.from("profiles").update({ plan: selected }).eq("id", userId);
      onUpgrade?.(selected);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.85)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", overflow: "auto" }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900 }}>Go Premium</h2>
          <p style={{ fontSize: 11, color: T.ash, marginTop: 2 }}>Find your travel tribe faster</p>
        </div>
        <button onClick={onClose} style={{ background: T.glass, border: "1px solid " + T.glassBorder, borderRadius: 10, color: T.white, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>✕ Maybe later</button>
      </div>

      {/* Billing toggle */}
      <div style={{ padding: "14px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", background: T.charcoal, borderRadius: 12, padding: 3, gap: 3 }}>
          {["monthly", "yearly"].map(b => (
            <button key={b} onClick={() => setBilling(b)} style={{ flex: 1, padding: "8px", borderRadius: 10, border: "none", background: billing === b ? `linear-gradient(135deg,${T.flame},${T.sunset})` : "transparent", color: T.white, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {b === "yearly" ? "Yearly" : "Monthly"}
              {b === "yearly" && <span style={{ background: T.mint, color: T.midnight, fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 6 }}>SAVE 35%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {PLANS.filter(p => p.id !== "free").map(plan => (
          <div key={plan.id} onClick={() => setSelected(plan.id)} style={{ borderRadius: 18, padding: "16px", border: `2px solid ${selected === plan.id ? plan.color : T.glassBorder}`, background: selected === plan.id ? plan.color + "12" : T.glass, cursor: "pointer", transition: "all .2s", position: "relative" }}>
            {plan.popular && (
              <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: `linear-gradient(135deg,${T.flame},${T.sunset})`, borderRadius: 20, padding: "3px 14px", fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>
                ⭐ MOST POPULAR
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 26 }}>{plan.icon}</span>
                <div>
                  <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: plan.color }}>{plan.name}</p>
                  <p style={{ fontSize: 10, color: T.ash }}>Perfect for frequent travelers</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: plan.color }}>
                  ${billing === "yearly" ? (plan.price * (1 - discount)).toFixed(2) : plan.price}
                </p>
                <p style={{ fontSize: 9, color: T.ash }}>/month{billing === "yearly" ? " · billed yearly" : ""}</p>
                {billing === "yearly" && <p style={{ fontSize: 9, color: T.mint }}>Save ${(plan.price * 12 * discount).toFixed(2)}/yr</p>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {plan.features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 12, color: plan.color }}>✓</span>
                  <span style={{ fontSize: 11, color: T.mist }}>{f}</span>
                </div>
              ))}
            </div>
            {selected === plan.id && (
              <div style={{ position: "absolute", top: 14, right: 14, width: 22, height: 22, borderRadius: "50%", background: plan.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 12, color: T.white }}>✓</span>
              </div>
            )}
          </div>
        ))}

        {/* CTA */}
        <button onClick={handleUpgrade} disabled={loading || currentPlan === selected} style={{ width: "100%", padding: "15px", borderRadius: 16, border: "none", background: loading ? T.slate : `linear-gradient(135deg,${T.flame},${T.sunset},${T.gold})`, backgroundSize: "200%", color: T.white, fontSize: 15, fontWeight: 800, cursor: loading ? "default" : "pointer", boxShadow: `0 6px 24px ${T.flame}44`, transition: "all .3s" }}>
          {loading ? "Processing... ⏳" : `Start ${PLANS.find(p => p.id === selected)?.name} ${billing === "yearly" ? "(Yearly)" : ""} 🚀`}
        </button>

        <p style={{ fontSize: 9, color: T.ash, textAlign: "center", lineHeight: 1.5 }}>
          Cancel anytime · Secure payment via Stripe · No hidden fees
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 4. PREMIUM BADGE + PLAN INDICATOR
// ══════════════════════════════════════════════════════════════
export function PlanBadge({ plan }) {
  if (!plan || plan === "free") return null;
  const config = {
    plus: { label: "Nomad ✈️", color: T.sunset, bg: T.sunset + "22" },
    pro:  { label: "Pro 👑",   color: T.gold,   bg: T.gold + "22" },
  }[plan] || {};
  return (
    <div style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, background: config.bg, border: `1px solid ${config.color}44` }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: config.color }}>{config.label}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 5. SUPER LIKE with premium gating
// ══════════════════════════════════════════════════════════════
export function SuperLikeButton({ plan, superLikes, onSuperLike, onUpgrade }) {
  const unlimited = plan === "pro";
  const remaining = unlimited ? "∞" : superLikes;
  const canUse = unlimited || superLikes > 0;

  return (
    <div style={{ position: "relative" }}>
      <button onClick={canUse ? onSuperLike : onUpgrade} style={{
        width: 44, height: 44, borderRadius: "50%",
        border: `2px solid ${canUse ? T.sky + "44" : T.ash + "44"}`,
        background: canUse ? T.sky + "12" : T.slate + "22",
        color: canUse ? T.sky : T.ash,
        cursor: "pointer", fontSize: 18,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>⭐</button>
      <div style={{ position: "absolute", bottom: -3, right: -3, background: canUse ? T.sky : T.slate, borderRadius: 8, padding: "1px 4px", fontSize: 8, fontWeight: 700, color: T.white, minWidth: 14, textAlign: "center" }}>
        {remaining}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 6. ADMIN VERIFICATION DASHBOARD
// ══════════════════════════════════════════════════════════════
export function AdminVerificationDashboard({ adminUserId }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function loadSubmissions() {
    setLoading(true);
    const { data } = await supabase
      .from("verifications")
      .select("*, profiles(name, avatar, city)")
      .order("submitted_at", { ascending: false });
    setSubmissions(data || []);
    setLoading(false);
  }

  async function updateStatus(id, userId, status) {
    setProcessing(true);
    await supabase.from("verifications").update({
      status, notes: note, reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    await loadSubmissions();
    setSelected(null);
    setNote("");
    setProcessing(false);
  }

  const statusColors = { pending: T.gold, verified: T.mint, rejected: T.rose };
  const statusIcons  = { pending: "⏳", verified: "✅", rejected: "❌" };

  if (loading) return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>🔄</div>
      <p style={{ color: T.ash, fontSize: 12 }}>Loading submissions...</p>
    </div>
  );

  return (
    <div style={{ padding: "0 0 24px" }}>
      <div style={{ padding: "14px 16px 10px" }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 900 }}>Verification Admin</h2>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {["pending","verified","rejected"].map(s => {
            const count = submissions.filter(x => x.status === s).length;
            return (
              <div key={s} style={{ flex: 1, padding: "8px", borderRadius: 10, background: statusColors[s] + "15", border: `1px solid ${statusColors[s]}33`, textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: statusColors[s] }}>{count}</p>
                <p style={{ fontSize: 9, color: T.ash, textTransform: "capitalize" }}>{s}</p>
              </div>
            );
          })}
        </div>
      </div>

      {submissions.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🛡️</div>
          <p style={{ color: T.ash, fontSize: 13 }}>No verification submissions yet</p>
        </div>
      ) : submissions.map(sub => (
        <div key={sub.id} onClick={() => setSelected(selected?.id === sub.id ? null : sub)} style={{ margin: "0 16px 10px", padding: "14px", borderRadius: 16, background: T.glass, border: `1px solid ${sub.status === "pending" ? T.gold + "44" : T.glassBorder}`, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: selected?.id === sub.id ? 12 : 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{sub.profiles?.avatar || "😎"}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: 13 }}>{sub.profiles?.name || "Unknown"}</p>
              <p style={{ fontSize: 10, color: T.ash }}>{sub.doc_type?.replace("_", " ")} · {new Date(sub.submitted_at).toLocaleDateString()}</p>
            </div>
            <div style={{ padding: "4px 10px", borderRadius: 8, background: statusColors[sub.status] + "22", border: `1px solid ${statusColors[sub.status]}44` }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: statusColors[sub.status] }}>{statusIcons[sub.status]} {sub.status}</span>
            </div>
          </div>

          {selected?.id === sub.id && (
            <div onClick={e => e.stopPropagation()}>
              {/* Document images */}
              <div style={{ display: "grid", gridTemplateColumns: sub.back_path ? "1fr 1fr 1fr" : "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[{url: sub.front_path, label: "Front"}, sub.back_path && {url: sub.back_path, label: "Back"}, {url: sub.selfie_path, label: "Selfie"}].filter(Boolean).map(img => (
                  <div key={img.label}>
                    <p style={{ fontSize: 9, color: T.ash, marginBottom: 4, textAlign: "center" }}>{img.label}</p>
                    <div style={{ borderRadius: 10, overflow: "hidden", background: T.charcoal, aspectRatio: "3/4" }}>
                      <img src={img.url} alt={img.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid " + T.glassBorder, background: T.glass, color: T.white, fontSize: 12, outline: "none", resize: "none", minHeight: 60, marginBottom: 10 }} />

              {/* Actions */}
              {sub.status === "pending" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => updateStatus(sub.id, sub.user_id, "verified")} disabled={processing} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${T.mint},${T.lime})`, color: T.midnight, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    ✅ Approve
                  </button>
                  <button onClick={() => updateStatus(sub.id, sub.user_id, "rejected")} disabled={processing} style={{ flex: 1, padding: "10px", borderRadius: 12, border: "none", background: T.rose + "22", borderColor: T.rose+"44", color: T.rose, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    ❌ Reject
                  </button>
                </div>
              )}
              {sub.status !== "pending" && sub.notes && (
                <p style={{ fontSize: 11, color: T.ash, fontStyle: "italic" }}>Note: {sub.notes}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default { SocialAuthButtons, NotificationSettings, PremiumPaywall, PlanBadge, SuperLikeButton, AdminVerificationDashboard };
