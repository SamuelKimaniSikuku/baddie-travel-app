import { useState, useEffect } from "react";
import { T } from "../theme";
import { isDemo } from "../lib/supabase";
import { authService } from "../services/auth";
import { nameIssue, emailIssue } from "../lib/moderation";

export default function AuthScreen({ onLogin }) {
  var [mode, setMode] = useState("splash");
  var [email, setEmail] = useState("");
  var [pw, setPw] = useState("");
  var [name, setName] = useState("");
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");
  var [emailSent, setEmailSent] = useState(false); // ← NEW

  useEffect(function() { var t = setTimeout(function(){ setMode("login"); }, 2200); return function(){ clearTimeout(t); }; }, []);

  async function submit() {
    if (mode === "signup") {
      var nErr = nameIssue(name);
      if (nErr) { setError(nErr); return; }
      var eErr = emailIssue(email);
      if (eErr) { setError(eErr); return; }
    }
    setLoading(true);
    setError("");
    try {
      if (isDemo) {
        setTimeout(function(){ onLogin({ name: name||"Traveler", email: email }); }, 1000);
        return;
      }
      var isSignup = mode === "signup";
      if (isSignup) {
        var result = await authService.signUp({ email, password: pw, name: name || "Traveler", avatar: "😎" });
        if (result.error) { setError(result.error.message); setLoading(false); return; }
        // If no session, email confirmation is required
        if (result.user && !result.session) {
          setEmailSent(true); // ← SHOW CONFIRMATION SCREEN
          setLoading(false);
          return;
        }
        if (result.user) onLogin(result.user);
      } else {
        var result = await authService.signIn({ email, password: pw });
        if (result.error) { setError(result.error.message); setLoading(false); return; }
        if (result.user) onLogin(result.user);
      }
    } catch (e) {
      setError(e.message || "Something went wrong");
      setLoading(false);
    }
  }

  if (mode === "splash") {
    return <div style={{ height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      background:"radial-gradient(ellipse at 30% 20%, "+T.flame+"22 0%, transparent 50%), "+T.midnight }}>
      <div style={{ animation:"popIn 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards", textAlign:"center" }}>
        <div style={{ fontSize:56, animation:"float 3s ease-in-out infinite" }}>✈️</div>
        <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:48, fontWeight:900,
          background:"linear-gradient(135deg,"+T.flame+","+T.sunset+","+T.gold+")",
          backgroundSize:"200% 200%", animation:"gradShift 3s ease infinite",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:-2 }}>baddie</h1>
        <p style={{ color:T.mist, fontSize:13, letterSpacing:4, textTransform:"uppercase", fontWeight:300, marginTop:8 }}>find your travel tribe</p>
      </div>
    </div>;
  }

  // ── Email confirmation screen ────────────────────────────
  if (emailSent) {
    return <div style={{ height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:32, textAlign:"center", background:"radial-gradient(ellipse at 20% 0%, "+T.flame+"12 0%, transparent 50%), "+T.midnight,
      animation:"fadeIn 0.5s ease" }}>
      <div style={{ animation:"popIn 0.6s cubic-bezier(0.34,1.56,0.64,1)", maxWidth:340 }}>
        <div style={{ fontSize:72, marginBottom:20, animation:"float 3s ease-in-out infinite" }}>✉️</div>
        <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:900, marginBottom:10,
          background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          Check your email!
        </h2>
        <p style={{ color:T.mist, fontSize:14, lineHeight:1.6, marginBottom:8 }}>
          We sent a confirmation link to
        </p>
        <p style={{ color:T.coral, fontWeight:700, fontSize:15, marginBottom:20,
          background:T.flame+"15", padding:"8px 16px", borderRadius:12, display:"inline-block" }}>
          {email}
        </p>
        <p style={{ color:T.ash, fontSize:12, lineHeight:1.6, marginBottom:28 }}>
          Click the link in your email to activate your account, then come back and sign in.
        </p>
        <button onClick={function(){ setEmailSent(false); setMode("login"); setError(""); }} style={{
          width:"100%", padding:"14px", borderRadius:14, border:"none",
          background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", color:T.white,
          fontSize:14, fontWeight:600, cursor:"pointer", boxShadow:"0 4px 24px "+T.flame+"44", marginBottom:12
        }}>Go to Sign In ✈️</button>
        <p style={{ color:T.ash, fontSize:11 }}>
          Didn't get it?{" "}
          <span onClick={submit} style={{ color:T.coral, cursor:"pointer", fontWeight:600 }}>Resend email</span>
        </p>
      </div>
    </div>;
  }

  var isSignupMode = mode === "signup";
  var inputSt = { width:"100%", padding:"13px 16px", borderRadius:14, border:"1px solid "+T.glassBorder, background:T.glass, color:T.white, fontSize:14, outline:"none" };

  return <div style={{ height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24,
    background:"radial-gradient(ellipse at 20% 0%, "+T.flame+"12 0%, transparent 50%), "+T.midnight, animation:"fadeIn 0.5s ease" }}>
    <div style={{ width:"100%", maxWidth:380 }}>
      <div style={{ textAlign:"center", marginBottom:40, animation:"fadeInUp 0.5s ease" }}>
        <div style={{ fontSize:36, marginBottom:8 }}>✈️</div>
        <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:32, fontWeight:900,
          background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>baddie</h1>
        <p style={{ color:T.ash, fontSize:12, marginTop:6 }}>{isSignupMode?"Create your account":"Welcome back, traveler"}</p>
        {isDemo && <p style={{ color:T.gold, fontSize:10, marginTop:4, background:T.gold+"15", padding:"4px 10px", borderRadius:8, display:"inline-block" }}>Demo Mode — No real account needed</p>}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12, animation:"fadeInUp 0.5s ease 0.1s both" }}>
        {isSignupMode && <input value={name} onChange={function(e){setName(e.target.value)}} placeholder="Your name" style={inputSt} />}
        <input value={email} onChange={function(e){setEmail(e.target.value)}} placeholder="Email" type="email" style={inputSt} />
        <input value={pw} onChange={function(e){setPw(e.target.value)}} placeholder="Password" type="password" style={inputSt}
          onKeyDown={function(e){if(e.key==="Enter")submit()}} />
        {error && <p style={{ color:T.rose, fontSize:12, textAlign:"center" }}>{error}</p>}
        <button onClick={submit} disabled={loading} style={{
          width:"100%", padding:"14px", borderRadius:14, border:"none",
          background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", color:T.white,
          fontSize:15, fontWeight:600, cursor:"pointer", boxShadow:"0 4px 24px "+T.flame+"44",
          opacity:loading?0.7:1
        }}>{loading?"Taking off... ✈️":isSignupMode?"Create Account":"Sign In"}</button>
      </div>
      <p style={{ textAlign:"center", marginTop:28, fontSize:13, color:T.ash }}>
        {isSignupMode?"Already have an account? ":"New to Baddie? "}
        <span onClick={function(){setMode(isSignupMode?"login":"signup"); setError(""); }} style={{ color:T.coral, cursor:"pointer", fontWeight:600 }}>
          {isSignupMode?"Sign in":"Create account"}
        </span>
      </p>
      {isSignupMode && <p style={{ textAlign:"center", marginTop:14, fontSize:10.5, color:T.ash, lineHeight:1.5 }}>
        By creating an account you confirm you're 18+ and agree to our{" "}
        <a href="/terms" style={{ color:T.mist }}>Terms</a> and <a href="/privacy" style={{ color:T.mist }}>Privacy Policy</a>.
      </p>}
      <div style={{ textAlign:"center", marginTop:isSignupMode?14:22, fontSize:11 }}>
        <a href="/privacy" style={{ color:T.slate, textDecoration:"none" }}>Privacy</a>
        <span style={{ color:T.slate, margin:"0 8px" }}>·</span>
        <a href="/terms" style={{ color:T.slate, textDecoration:"none" }}>Terms</a>
      </div>
    </div>
  </div>;
}
