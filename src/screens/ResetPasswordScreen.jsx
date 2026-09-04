import { useState, useEffect } from "react";
import { T } from "../theme";
import { supabase, isDemo } from "../lib/supabase";
import { authService } from "../services/auth";

// ══════════════════════════════════════════════════════════════
// ResetPasswordScreen — landing target of the password-recovery
// email (/reset-password). Supabase puts a recovery session in the
// URL hash; once detected, the user sets a new password.
// ══════════════════════════════════════════════════════════════
export default function ResetPasswordScreen() {
  var [ready, setReady] = useState(false);      // recovery session present?
  var [checking, setChecking] = useState(true);
  var [pw, setPw] = useState("");
  var [pw2, setPw2] = useState("");
  var [busy, setBusy] = useState(false);
  var [done, setDone] = useState(false);
  var [error, setError] = useState("");

  useEffect(function(){
    if (isDemo) { setChecking(false); return; }
    // detectSessionInUrl processes the recovery link; give it a moment,
    // and also listen for the PASSWORD_RECOVERY event.
    var { data: { subscription } } = supabase.auth.onAuthStateChange(function(event, session){
      if (session) { setReady(true); setChecking(false); }
    });
    supabase.auth.getSession().then(function(res){
      if (res.data?.session) setReady(true);
      setChecking(false);
    });
    return function(){ subscription?.unsubscribe(); };
  }, []);

  async function submit() {
    setError("");
    if (pw.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (pw !== pw2) { setError("Passwords don't match."); return; }
    setBusy(true);
    var res = await authService.updatePassword(pw);
    setBusy(false);
    if (res.error) { setError(res.error.message || "Could not update password."); return; }
    setDone(true);
    setTimeout(function(){ window.location.href = "/"; }, 1800);
  }

  var wrap = { height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24,
    background:"radial-gradient(ellipse at 20% 0%, "+T.flame+"12 0%, transparent 50%), "+T.midnight, color:T.white, fontFamily:"'Sora',sans-serif" };
  var card = { width:"100%", maxWidth:380, textAlign:"center" };
  var inp = { width:"100%", padding:"13px 16px", borderRadius:14, border:"1px solid "+T.glassBorder, background:T.glass,
    color:T.white, fontSize:14, outline:"none", marginBottom:12, boxSizing:"border-box" };
  var btn = function(enabled){ return { width:"100%", padding:"14px", borderRadius:14, border:"none",
    background: enabled ? "linear-gradient(135deg,"+T.flame+","+T.sunset+")" : T.slate, color:T.white,
    fontSize:14, fontWeight:700, cursor: enabled ? "pointer" : "default", opacity: enabled ? 1 : 0.6 }; };

  if (checking) return <div style={wrap}><div style={{ fontSize:40, animation:"float 2s ease-in-out infinite" }}>🔑</div></div>;

  if (done) return <div style={wrap}><div style={card}>
    <div style={{ fontSize:52, marginBottom:14 }}>✅</div>
    <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:24, color:T.mint }}>Password updated</h1>
    <p style={{ color:T.mist, fontSize:13, marginTop:8 }}>Taking you back to Baddie…</p>
  </div></div>;

  if (!ready) return <div style={wrap}><div style={card}>
    <div style={{ fontSize:48, marginBottom:14 }}>⏳</div>
    <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:22 }}>Reset link needed</h1>
    <p style={{ color:T.mist, fontSize:13, marginTop:10, lineHeight:1.6 }}>
      This page only works from the link in your password-reset email. If your link expired, request a new one from the sign-in screen.
    </p>
    <button onClick={function(){ window.location.href = "/login"; }} style={{ ...btn(true), marginTop:20 }}>Go to Sign In</button>
  </div></div>;

  return <div style={wrap}><div style={card}>
    <div style={{ fontSize:44, marginBottom:12 }}>🔑</div>
    <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:24, marginBottom:6 }}>Set a new password</h1>
    <p style={{ color:T.ash, fontSize:12, marginBottom:22 }}>Make it at least 8 characters.</p>
    <input type="password" value={pw} onChange={function(e){setPw(e.target.value)}} placeholder="New password" style={inp} />
    <input type="password" value={pw2} onChange={function(e){setPw2(e.target.value)}} placeholder="Repeat new password" style={inp}
      onKeyDown={function(e){ if(e.key==="Enter") submit(); }} />
    {error && <p style={{ color:T.rose, fontSize:12, marginBottom:12 }}>⚠️ {error}</p>}
    <button onClick={submit} disabled={busy} style={btn(!busy)}>{busy ? "Saving…" : "Update password"}</button>
  </div></div>;
}
