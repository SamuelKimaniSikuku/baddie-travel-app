import { useState, useEffect } from "react";
import { T } from "../theme";
import { useAuth } from "../hooks/useSupabase";
import { kycService, ID_TYPES } from "../services/kyc";

// ══════════════════════════════════════════════════════════════
// VerifyScreen — Didit hosted KYC. Reached at /verify (also the
// callback target after the hosted flow). Shows the current state
// and, when unverified/rejected, starts a new session.
// ══════════════════════════════════════════════════════════════
export default function VerifyScreen() {
  var auth = useAuth();
  var [v, setV] = useState(null);           // verification state
  var [loading, setLoading] = useState(true);
  var [idType, setIdType] = useState("");
  var [consent, setConsent] = useState(false);
  var [starting, setStarting] = useState(false);
  var [error, setError] = useState("");

  function refresh() {
    kycService.fetchVerification().then(function(res){ setV(res); setLoading(false); });
  }
  useEffect(function(){ if (!auth.loading) refresh(); }, [auth.loading, auth.user]);

  function goApp() { window.location.href = "/"; }

  async function start() {
    if (!idType || !consent) return;
    setStarting(true); setError("");
    var res = await kycService.startVerification(idType);
    if (res.error || !res.url) { setError(res.error?.message || "Could not start verification"); setStarting(false); return; }
    window.location.href = res.url; // redirect to Didit hosted flow
  }

  var wrap = { minHeight:"100vh", background:T.midnight, color:T.white, display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'Sora',sans-serif" };
  var card = { width:"100%", maxWidth:440, textAlign:"center" };

  if (auth.loading || loading) return <div style={wrap}><div style={{ fontSize:40, animation:"float 2s ease-in-out infinite" }}>🛡️</div></div>;

  if (!auth.user) return <div style={wrap}><div style={card}>
    <div style={{ fontSize:44, marginBottom:12 }}>🔒</div>
    <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:24 }}>Sign in to verify</h1>
    <p style={{ color:T.mist, fontSize:13, marginTop:8 }}>You need to be signed in to verify your identity.</p>
    <button onClick={goApp} style={btn(true)}>Go to Baddie →</button>
  </div></div>;

  var status = v?.status || "unverified";

  if (status === "verified") return <div style={wrap}><div style={card}>
    <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
    <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:24, color:T.mint }}>Identity verified</h1>
    <p style={{ color:T.mist, fontSize:13, marginTop:8 }}>You have the ✓ verified badge on your profile.</p>
    <button onClick={goApp} style={btn(true)}>Back to Baddie</button>
  </div></div>;

  if (status === "pending") return <div style={wrap}><div style={card}>
    <div style={{ fontSize:48, marginBottom:12 }}>⏳</div>
    <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:24, color:T.gold }}>Verification in progress</h1>
    <p style={{ color:T.mist, fontSize:13, marginTop:8, lineHeight:1.6 }}>Your identity check is being processed — the ✓ badge appears on your profile as soon as it's approved, usually within minutes.</p>
    <button onClick={goApp} style={btn(false)}>Back to Baddie</button>
  </div></div>;

  if (status === "in_review") return <div style={wrap}><div style={card}>
    <div style={{ fontSize:48, marginBottom:12 }}>🔎</div>
    <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:24, color:T.sky }}>A reviewer is checking</h1>
    <p style={{ color:T.mist, fontSize:13, marginTop:8, lineHeight:1.6 }}>One of our team is taking a closer look at your submission. This usually resolves within 24 hours — we'll update your badge automatically.</p>
    <button onClick={goApp} style={btn(false)}>Back to Baddie</button>
  </div></div>;

  if (status === "rejected" && v?.declineReason === "duplicate_account") return <div style={wrap}><div style={card}>
    <div style={{ fontSize:48, marginBottom:12 }}>👥</div>
    <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:24, color:T.rose }}>This ID is already verified</h1>
    <p style={{ color:T.mist, fontSize:13, marginTop:8, lineHeight:1.6 }}>This identity is already verified on another account. Each traveler can verify one account. If you think this is a mistake, contact <a href="mailto:support@baddie.app" style={{ color:T.coral }}>support@baddie.app</a>.</p>
    <button onClick={goApp} style={btn(false)}>Back to Baddie</button>
  </div></div>;

  // unverified OR a retryable rejection → show the start form
  return <div style={wrap}><div style={{ ...card, textAlign:"left" }}>
    <div style={{ textAlign:"center", marginBottom:20 }}>
      <div style={{ fontSize:44, marginBottom:10 }}>🛡️</div>
      <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:24 }}>Verify your identity</h1>
      <p style={{ color:T.mist, fontSize:13, marginTop:6, lineHeight:1.6 }}>Build trust with other travelers. Verified users get a ✅ badge. Your ID scan and selfie are handled securely by our verification partner — they never touch our servers.</p>
    </div>

    {status === "rejected" && <div style={{ padding:"11px 13px", borderRadius:12, background:T.rose+"14", border:"1px solid "+T.rose+"44", marginBottom:16 }}>
      <p style={{ fontSize:12, color:T.rose, fontWeight:600 }}>Previous check didn't pass</p>
      <p style={{ fontSize:11, color:T.mist, marginTop:3 }}>Make sure your document is clear, unexpired, and well-lit, then try again.</p>
    </div>}

    <p style={{ fontSize:11, color:T.ash, textTransform:"uppercase", letterSpacing:1.5, marginBottom:8 }}>Choose your document</p>
    <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
      {ID_TYPES.map(function(d){
        var active = idType === d.value;
        return <button key={d.value} onClick={function(){ setIdType(d.value); }} style={{
          display:"flex", alignItems:"center", gap:12, padding:"14px", borderRadius:14, cursor:"pointer",
          background: active ? T.flame+"18" : T.glass, border:"1.5px solid "+(active ? T.flame : T.glassBorder), color:T.white, textAlign:"left" }}>
          <span style={{ fontSize:24 }}>{d.icon}</span>
          <span style={{ flex:1, fontSize:14, fontWeight:600, color: active ? T.coral : T.white }}>{d.label}</span>
          {active && <span style={{ color:T.flame }}>✓</span>}
        </button>;
      })}
    </div>

    <label style={{ display:"flex", alignItems:"flex-start", gap:9, marginBottom:16, cursor:"pointer" }}>
      <input type="checkbox" checked={consent} onChange={function(e){ setConsent(e.target.checked); }} style={{ marginTop:2 }} />
      <span style={{ fontSize:11, color:T.mist, lineHeight:1.5 }}>I consent to my ID and selfie being processed by the verification partner to confirm my identity.</span>
    </label>

    {error && <p style={{ color:T.rose, fontSize:11, marginBottom:12 }}>⚠️ {error}</p>}

    <button onClick={start} disabled={!idType || !consent || starting} style={btn(idType && consent && !starting)}>
      {starting ? "Starting…" : "Start verification 🛂"}
    </button>
    <button onClick={goApp} style={{ ...btn(false), background:"transparent", border:"1px solid "+T.glassBorder, color:T.mist, marginTop:8 }}>Cancel</button>
  </div></div>;
}

function btn(enabled) {
  return {
    width:"100%", marginTop:16, padding:"13px", borderRadius:14, border:"none",
    background: enabled ? "linear-gradient(135deg,"+T.flame+","+T.sunset+")" : T.slate,
    color:T.white, fontSize:14, fontWeight:700, cursor: enabled ? "pointer" : "not-allowed", opacity: enabled ? 1 : 0.6,
  };
}
