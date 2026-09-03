import { T } from "../theme";

// ══════════════════════════════════════════════════════════════
// LandingScreen — public marketing front door at "/".
// Logged-out visitors land here; CTAs go to /login. Signed-in
// users never see it (App routes them straight into the app).
// ══════════════════════════════════════════════════════════════

function go(path) { window.location.href = path; }

var Brand = function({ size }) {
  return <span style={{ display:"inline-flex", alignItems:"center", gap:8 }}>
    <span style={{ fontSize: (size||22) - 2 }}>✈️</span>
    <span style={{ fontFamily:"'Fraunces',serif", fontSize:size||22, fontWeight:900,
      background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>baddie</span>
  </span>;
};

// ── CSS-built phone mockup showing a Discover card ──
function PhoneMock() {
  var chip = function(txt, color){ return <span style={{ background:(color||T.white)+"14", border:"1px solid "+(color||T.white)+"22",
    borderRadius:10, padding:"3px 10px", fontSize:10, color:color||T.cloud }}>{txt}</span>; };
  return <div style={{ width:300, borderRadius:38, border:"2px solid "+T.flame+"66", background:T.midnight,
    boxShadow:"0 40px 90px rgba(0,0,0,0.6), 0 0 80px "+T.flame+"22", padding:"14px 12px 10px", flexShrink:0 }}>
    {/* status bar */}
    <div style={{ display:"flex", justifyContent:"space-between", padding:"0 10px 8px", fontSize:10, color:T.mist }}>
      <span>9:41</span><span>📶 🔋</span>
    </div>
    {/* app header */}
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 6px 10px" }}>
      <Brand size={17} />
      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
        <span style={{ fontSize:13 }}>🔔</span>
        <span style={{ width:22, height:22, borderRadius:"50%", background:T.charcoal, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:11 }}>😎</span>
      </div>
    </div>
    {/* discover card */}
    <div style={{ borderRadius:20, overflow:"hidden", border:"1px solid "+T.glassBorder,
      background:"linear-gradient(160deg,"+T.flame+"3a,"+T.sunset+"26 45%,"+T.violet+"1f)", padding:"18px 14px 14px", position:"relative" }}>
      <div style={{ position:"absolute", top:10, right:10, background:"rgba(0,0,0,0.45)", borderRadius:10, padding:"3px 9px", fontSize:11 }}>
        <span style={{ color:T.mint, fontWeight:700 }}>92%</span> <span style={{ color:T.mist, fontSize:9 }}>match</span>
      </div>
      <div style={{ fontSize:52, textAlign:"center", margin:"14px 0 10px" }}>👩🏾</div>
      <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
        <span style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:700 }}>Amara, 27</span>
        <span style={{ fontSize:11, color:T.sky }}>✔</span>
        <span style={{ fontSize:10, color:T.mist }}>Nairobi</span>
      </div>
      <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:"linear-gradient(135deg,"+T.flame+"cc,"+T.sunset+"cc)",
        borderRadius:14, padding:"3px 11px", margin:"7px 0 9px", fontSize:11, fontWeight:600 }}>🏝️ Zanzibar · Sep 5 – 18</div>
      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        {chip("Hiking")}{chip("Wildlife")}{chip("Photography")}
      </div>
    </div>
    {/* actions */}
    <div style={{ display:"flex", justifyContent:"center", gap:16, padding:"12px 0 8px" }}>
      <span style={{ width:38, height:38, borderRadius:"50%", border:"1.5px solid "+T.rose+"66", color:T.rose, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>✕</span>
      <span style={{ width:38, height:38, borderRadius:"50%", border:"1.5px solid "+T.mint+"66", color:T.mint, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>✈</span>
    </div>
    {/* tab bar */}
    <div style={{ display:"flex", justifyContent:"space-around", borderTop:"1px solid "+T.glass, paddingTop:8, fontSize:9, color:T.ash }}>
      <span style={{ color:T.flame }}>🔥<br/>Discover</span><span>💬<br/>Chats</span><span>✈️<br/>Trips</span><span>👤<br/>Profile</span>
    </div>
  </div>;
}

var FEATURES = [
  { icon:"🔥", title:"Match",   body:"Swipe travelers heading to the same place, on the same dates, with your vibe and budget." },
  { icon:"💬", title:"Plan together", body:"Chat with matches and share flights, polls and checklists without leaving the conversation." },
  { icon:"✈️", title:"Trips",   body:"Build the itinerary, save flights and count down to takeoff — everything in one place." },
  { icon:"🛡️", title:"Verified", body:"ID + selfie verification gives real travelers a ✓ badge. Duplicates get auto-declined." },
];

export default function LandingScreen() {
  var section = { maxWidth:1120, margin:"0 auto", padding:"0 24px" };
  var btnPrimary = { padding:"15px 30px", borderRadius:16, border:"none", cursor:"pointer",
    background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", color:T.white, fontSize:15, fontWeight:700,
    boxShadow:"0 8px 30px "+T.flame+"55" };

  return <div id="landing-scroll" style={{ height:"100vh", overflowY:"auto", overflowX:"hidden", background:T.midnight, color:T.white, fontFamily:"'Sora',sans-serif" }}>

    {/* Nav */}
    <div style={{ position:"sticky", top:0, zIndex:20, background:T.midnight+"ee", backdropFilter:"blur(10px)", borderBottom:"1px solid "+T.glass }}>
      <div style={{ ...section, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 24px" }}>
        <Brand />
        <button onClick={function(){ go("/login"); }} style={{ padding:"9px 20px", borderRadius:14, border:"none", cursor:"pointer",
          background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", color:T.white, fontSize:13, fontWeight:700 }}>Sign In</button>
      </div>
    </div>

    {/* Hero */}
    <div style={{ background:"radial-gradient(ellipse at 25% 0%, "+T.flame+"14 0%, transparent 50%)" }}>
      <div className="landing-hero" style={{ ...section, padding:"72px 24px 88px" }}>
        <div style={{ maxWidth:560 }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:8, border:"1px solid "+T.mint+"55", color:T.mint,
            borderRadius:20, padding:"6px 16px", fontSize:12, fontWeight:600, letterSpacing:1 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:T.mint, display:"inline-block" }} />
            NOW LIVE · FREE TO JOIN
          </span>
          <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:58, lineHeight:1.06, fontWeight:900, margin:"22px 0 0" }}>
            Travel buddies<br/>
            <span style={{ background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>matched,</span><br/>
            <span style={{ background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>verified</span><br/>
            and trip-ready.
          </h1>
          <p style={{ color:T.mist, fontSize:17, lineHeight:1.7, margin:"22px 0 30px", maxWidth:470 }}>
            Baddie is where solo travelers find their crew. Match with verified people heading to your destination on your dates — then chat, plan and fly together.
          </p>
          <button onClick={function(){ go("/login"); }} style={btnPrimary}>Get Started — it's free →</button>
        </div>
        <PhoneMock />
      </div>
    </div>

    {/* Features */}
    <div style={{ background:"#0D0D1B", borderTop:"1px solid "+T.glass, borderBottom:"1px solid "+T.glass }}>
      <div style={{ ...section, padding:"72px 24px" }}>
        <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:34, textAlign:"center" }}>Every kind of traveler</h2>
        <p style={{ color:T.ash, textAlign:"center", marginTop:8, marginBottom:40 }}>Find your people and see the world together</p>
        <div className="landing-cards">
          {FEATURES.map(function(f){
            return <div key={f.title} style={{ borderRadius:18, border:"1px solid "+T.glassBorder, background:T.glass, padding:"24px 20px" }}>
              <div style={{ fontSize:30, marginBottom:14 }}>{f.icon}</div>
              <h3 style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>{f.title}</h3>
              <p style={{ color:T.mist, fontSize:13.5, lineHeight:1.65 }}>{f.body}</p>
            </div>;
          })}
        </div>
      </div>
    </div>

    {/* Stats */}
    <div style={{ ...section, padding:"64px 24px" }}>
      <div className="landing-stats">
        {[["100%","Free to join"],["ID ✓","Verified travelers"],["🌍","Any destination"]].map(function(s){
          return <div key={s[1]} style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:44, fontWeight:900, color:T.coral }}>{s[0]}</div>
            <div style={{ color:T.ash, fontSize:13, marginTop:6 }}>{s[1]}</div>
          </div>;
        })}
      </div>
    </div>

    {/* CTA band */}
    <div style={{ background:"linear-gradient(160deg,"+T.flame+"2e,"+T.sunset+"1f 55%,"+T.midnight+")", borderTop:"1px solid "+T.flame+"33" }}>
      <div style={{ ...section, padding:"84px 24px", textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:14 }}>✈️</div>
        <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:38, fontWeight:900 }}>Find your travel tribe</h2>
        <p style={{ color:T.mist, marginTop:12, marginBottom:30, fontSize:15, lineHeight:1.7 }}>
          Create your profile, get verified, and match with travelers<br/>heading exactly where you're going.
        </p>
        <button onClick={function(){ go("/login"); }} style={btnPrimary}>Create your account →</button>
        <p style={{ color:T.ash, fontSize:11.5, marginTop:14 }}>Free · 18+ · ID-verified community · No spam</p>
      </div>
    </div>

    {/* Footer */}
    <div style={{ borderTop:"1px solid "+T.glass }}>
      <div style={{ ...section, padding:"26px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
        <Brand size={17} />
        <div style={{ display:"flex", gap:22, fontSize:13 }}>
          <a href="/privacy" style={{ color:T.mist, textDecoration:"none" }}>Privacy Policy</a>
          <a href="/terms" style={{ color:T.mist, textDecoration:"none" }}>Terms</a>
          <a href="mailto:support@baddie.app" style={{ color:T.mist, textDecoration:"none" }}>Support</a>
        </div>
        <span style={{ color:T.ash, fontSize:12 }}>© 2026 Baddie</span>
      </div>
    </div>
  </div>;
}
