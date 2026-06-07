import { useState, useEffect } from "react";
import { T } from "../theme";
import { NotificationSettings } from "../components/PremiumFeatures";

// ══════════════════════════════════════════════════════════════
// Settings sub-screens reached from ProfileScreen menu items.
// Each renders inside the profile flow with a back arrow.
// ══════════════════════════════════════════════════════════════

// ── Shared chrome ─────────────────────────────────────────────
function Screen({ title, onBack, children }) {
  return <div style={{ flex:1, overflow:"auto", padding:"0 16px 24px" }}>
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 0", position:"sticky", top:0, background:T.midnight, zIndex:2 }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:T.coral, fontSize:22, cursor:"pointer", lineHeight:1 }}>‹</button>
      <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:18 }}>{title}</h2>
    </div>
    {children}
  </div>;
}

function Toggle({ on }) {
  return <div style={{ width:44, height:24, borderRadius:12, background: on ? T.flame : T.slate,
    position:"relative", transition:"background .2s", flexShrink:0 }}>
    <div style={{ position:"absolute", top:3, left: on ? 22 : 3, width:18, height:18, borderRadius:"50%",
      background:T.white, transition:"left .2s", boxShadow:"0 1px 4px rgba(0,0,0,.3)" }} />
  </div>;
}

function ToggleRow({ icon, label, desc, on, onClick }) {
  return <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
    borderRadius:14, background:T.glass, border:"1px solid "+T.glassBorder, cursor:"pointer", marginBottom:8 }}>
    <span style={{ fontSize:20 }}>{icon}</span>
    <div style={{ flex:1 }}>
      <p style={{ fontSize:13, fontWeight:600 }}>{label}</p>
      {desc && <p style={{ fontSize:10, color:T.ash, marginTop:2 }}>{desc}</p>}
    </div>
    <Toggle on={on} />
  </div>;
}

// localStorage-backed preference map, namespaced per user.
function usePrefs(storeKey, defaults) {
  var [prefs, setPrefs] = useState(function(){
    try {
      var raw = typeof localStorage !== "undefined" && localStorage.getItem(storeKey);
      return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    } catch (e) { return defaults; }
  });
  function toggle(key) {
    setPrefs(function(prev){
      var next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }
  return [prefs, toggle];
}

// ── Notifications ─────────────────────────────────────────────
export function NotificationsScreen({ userId, profile, onBack }) {
  return <Screen title="Notifications" onBack={onBack}>
    <NotificationSettings userId={userId} profile={profile} />
  </Screen>;
}

// ── Privacy ───────────────────────────────────────────────────
export function PrivacyScreen({ userId, onBack }) {
  var [prefs, toggle] = usePrefs("baddie_privacy_"+(userId||"me"), {
    discoverable: true, showOnline: true, readReceipts: true, showDistance: true,
  });
  var rows = [
    { key:"discoverable", icon:"🧭", label:"Show me in Discovery", desc:"Turn off to hide your profile from new people" },
    { key:"showOnline",   icon:"🟢", label:"Show online status",   desc:"Let matches see when you're active" },
    { key:"readReceipts", icon:"✓✓", label:"Read receipts",        desc:"Show others when you've read their messages" },
    { key:"showDistance", icon:"📍", label:"Show distance",        desc:"Display how far away you are on your profile" },
  ];
  return <Screen title="Privacy" onBack={onBack}>
    {rows.map(function(r){
      return <ToggleRow key={r.key} icon={r.icon} label={r.label} desc={r.desc}
        on={prefs[r.key]} onClick={function(){ toggle(r.key); }} />;
    })}
    <div style={{ padding:"12px 14px", borderRadius:14, background:T.sky+"10", border:"1px solid "+T.sky+"22", marginTop:8 }}>
      <p style={{ fontSize:11, color:T.sky, lineHeight:1.5 }}>🛡️ To block or report someone, open their chat and tap the ••• menu. Blocked travelers can never see or message you again.</p>
    </div>
  </Screen>;
}

// ── Appearance ────────────────────────────────────────────────
export function AppearanceScreen({ userId, onBack }) {
  var [prefs, toggle] = usePrefs("baddie_appearance_"+(userId||"me"), {
    reduceMotion: false, reduceTransparency: false,
  });

  // Apply preferences globally via an injected stylesheet so they take
  // effect immediately and persist across the session.
  useEffect(function(){
    var rules = "";
    if (prefs.reduceMotion) rules += "*{animation:none!important;transition:none!important;}";
    if (prefs.reduceTransparency) rules += "*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}";
    var el = document.getElementById("baddie-appearance-overrides");
    if (!el) {
      el = document.createElement("style");
      el.id = "baddie-appearance-overrides";
      document.head.appendChild(el);
    }
    el.textContent = rules;
  }, [prefs.reduceMotion, prefs.reduceTransparency]);

  return <Screen title="Appearance" onBack={onBack}>
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px", borderRadius:14,
      background:"linear-gradient(135deg,"+T.midnight+","+T.ink+")", border:"1px solid "+T.glassBorder, marginBottom:12 }}>
      <span style={{ fontSize:22 }}>🌙</span>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:13, fontWeight:600 }}>Theme</p>
        <p style={{ fontSize:10, color:T.ash, marginTop:2 }}>Midnight (dark) — tuned for low light</p>
      </div>
      <span style={{ fontSize:11, color:T.mint, fontWeight:600 }}>Active</span>
    </div>
    <ToggleRow icon="🎬" label="Reduce motion" desc="Disable animations and transitions"
      on={prefs.reduceMotion} onClick={function(){ toggle("reduceMotion"); }} />
    <ToggleRow icon="🪟" label="Reduce transparency" desc="Make glass panels solid for readability"
      on={prefs.reduceTransparency} onClick={function(){ toggle("reduceTransparency"); }} />
  </Screen>;
}

// ── Help ──────────────────────────────────────────────────────
var FAQS = [
  { q:"How does matching work?", a:"When you and another traveler both like each other, it's a match. We rank people by shared destination, overlapping travel dates, vibe, budget and interests." },
  { q:"How do I get a verified badge?", a:"Go to Photos & Verification, submit an ID document and a selfie. Our team reviews it (usually within 24–48 hours) and the ✓ badge appears once approved." },
  { q:"Is my information safe?", a:"Your verification documents are encrypted and only seen by our review team — never shared with other users. You control what shows on your profile in Privacy settings." },
  { q:"How do I block or report someone?", a:"Open the chat with that person, tap the ••• menu, and choose Block or Report. Blocked users can't contact you again." },
  { q:"How do I plan a trip together?", a:"Once matched, open your chat and use the share menu to send flights, polls, itineraries and split expenses — all from inside the conversation." },
];

function FaqItem({ q, a }) {
  var [open, setOpen] = useState(false);
  return <div style={{ borderRadius:14, background:T.glass, border:"1px solid "+T.glassBorder, marginBottom:8, overflow:"hidden" }}>
    <div onClick={function(){ setOpen(!open); }} style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 14px", cursor:"pointer" }}>
      <span style={{ flex:1, fontSize:13, fontWeight:600 }}>{q}</span>
      <span style={{ color:T.coral, fontSize:16, transform: open ? "rotate(45deg)" : "none", transition:"transform .2s" }}>+</span>
    </div>
    {open && <p style={{ fontSize:12, color:T.mist, lineHeight:1.6, padding:"0 14px 14px" }}>{a}</p>}
  </div>;
}

export function HelpScreen({ onBack }) {
  return <Screen title="Help" onBack={onBack}>
    <p style={{ fontSize:11, color:T.ash, marginBottom:12 }}>Frequently asked questions</p>
    {FAQS.map(function(f){ return <FaqItem key={f.q} q={f.q} a={f.a} />; })}

    <a href="mailto:support@baddie.app?subject=Baddie%20Support" style={{ display:"flex", alignItems:"center", gap:12,
      padding:"14px", borderRadius:14, background:"linear-gradient(135deg,"+T.flame+"22,"+T.sunset+"22)",
      border:"1px solid "+T.flame+"33", textDecoration:"none", color:T.white, marginTop:8 }}>
      <span style={{ fontSize:20 }}>✉️</span>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:13, fontWeight:600 }}>Contact support</p>
        <p style={{ fontSize:10, color:T.ash, marginTop:2 }}>support@baddie.app</p>
      </div>
      <span style={{ color:T.coral }}>›</span>
    </a>

    <p style={{ fontSize:10, color:T.ash, textAlign:"center", marginTop:20 }}>Baddie · v1.0.0</p>
  </Screen>;
}
