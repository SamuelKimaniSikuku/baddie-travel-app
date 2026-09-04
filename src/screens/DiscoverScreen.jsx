import { useState, useRef, useEffect } from "react";
import { T } from "../theme";
import { TRAVELERS } from "../data/mock";
import { useDiscovery } from "../hooks/useSupabase";
import { isDemo } from "../lib/supabase";
import { profilesService } from "../services/profiles";
import { calcCompatibility as calcCompat, compatibilityReasons } from "../lib/compatibility";
import VerifiedBadge from "../ui/VerifiedBadge";

export default function DiscoverScreen({ onMatch, matches, userId, userProfile }) {
  var discovery = useDiscovery(isDemo ? null : userId);
  var [demoCards, setDemoCards] = useState(function(){ return TRAVELERS.filter(function(t){ return !matches.find(function(m){return m.id===t.id}); }); });
  var [dragging, setDragging] = useState(false);
  var [dragX, setDragX] = useState(0);
  var [exitDir, setExitDir] = useState(null);
  var [showDetails, setShowDetails] = useState(false);
  var startX = useRef(0);
  var moved = useRef(false);

  var current, hasMore;
  if (isDemo) {
    current = demoCards[demoCards.length - 1];
    hasMore = demoCards.length > 0;
  } else {
    current = discovery.currentTraveler;
    hasMore = discovery.hasMore;
  }

  var likeOp = Math.min(1, Math.max(0, dragX / 100));
  var nopeOp = Math.min(1, Math.max(0, -dragX / 100));

  function onStart(x) { setDragging(true); startX.current = x; moved.current = false; }
  function onMove(x) { if (!dragging) return; var dx = x - startX.current; if (Math.abs(dx) > 5) moved.current = true; setDragX(dx); }
  function onEnd() {
    setDragging(false);
    if (!moved.current) { setDragX(0); setShowDetails(true); return; } // tap → details
    if (Math.abs(dragX) > 110) { swipe(dragX > 0 ? "right" : "left"); }
    else { setDragX(0); }
  }

  async function swipe(dir) {
    setExitDir(dir);
    setTimeout(async function() {
      if (isDemo) {
        if (dir === "right" && current) onMatch(current);
        setDemoCards(function(p){ return p.slice(0,-1); });
      } else {
        if (current) {
          var action = dir === "right" ? "like" : "pass";
          var result = await discovery.swipe(current.id, action);
          if (result && result.isMatch) onMatch(current);
        }
      }
      setExitDir(null); setDragX(0);
    }, 300);
  }

  // Keyboard controls (web app): ← pass, → like, ↑/Enter details, Esc close.
  useEffect(function(){
    function onKey(e) {
      if (!current) return;
      if (e.key === "Escape") { setShowDetails(false); return; }
      if (showDetails) return; // don't swipe while the details sheet is open
      if (e.key === "ArrowLeft") { e.preventDefault(); swipe("left"); }
      else if (e.key === "ArrowRight") { e.preventDefault(); swipe("right"); }
      else if (e.key === "ArrowUp" || e.key === "Enter") { e.preventDefault(); setShowDetails(true); }
    }
    window.addEventListener("keydown", onKey);
    return function(){ window.removeEventListener("keydown", onKey); };
  }, [current, showDetails]);

  if (!current || !hasMore) return <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
    <div style={{ fontSize:56, marginBottom:12 }}>🌍</div>
    <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:22 }}>No more travelers</h2>
    <p style={{ color:T.ash, marginTop:8, textAlign:"center" }}>Check back soon for new travel buddies!</p>
  </div>;

  var displayName = current.name || "Traveler";
  var displayDest = current.destination || "";
  var displayDestEmoji = current.destEmoji || current.destination_emoji || "🌍";
  var displayDates = current.dates || current.date_display || "";
  var displayBio = current.bio || "";
  var displayCity = current.city || "";
  var displayAge = current.age || "";
  var displayAvatar = current.avatar || current.avatar_url || "😎";
  var displayInterests = current.interests || [];

  var meProfile = userProfile || {vibe:"Adventurous",budget:"Mid-range",interests:["Hiking","Food","Photography"]};
  var compat = userProfile ? profilesService.calcCompatibility(userProfile, current) : calcCompat(meProfile, current);
  var reasons = compatibilityReasons(meProfile, current);

  // Honest match color: only strong matches read green.
  var matchColor = compat >= 75 ? T.mint : compat >= 50 ? T.gold : T.mist;

  return <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 16px 12px", overflow:"hidden" }}>
    {/* Card + actions travel together, centered — no dead zone between them. */}
    <div style={{ flex:1, minHeight:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      {/* Deck wrapper defines the card size; stacked cards + top card fill it. */}
      <div style={{ position:"relative", width:"min(360px, 100%, 46vh)", aspectRatio:"3/4.2" }}>
        {(isDemo ? demoCards.slice(-3,-1) : []).map(function(c,i){
          return <div key={c.id} style={{ position:"absolute", inset:0,
            borderRadius:22, background:T.charcoal, border:"1px solid "+T.glassBorder,
            transform:"scale("+(0.92+i*0.04)+") translateY("+((1-i)*10)+"px)", opacity:0.4+i*0.3 }} />;
        })}
        <div
          onMouseDown={function(e){onStart(e.clientX)}}
          onMouseMove={function(e){onMove(e.clientX)}}
          onMouseUp={onEnd} onMouseLeave={function(){if(dragging)onEnd()}}
          onTouchStart={function(e){onStart(e.touches[0].clientX)}}
          onTouchMove={function(e){onMove(e.touches[0].clientX)}}
          onTouchEnd={onEnd}
          style={{
            position:"absolute", inset:0,
            borderRadius:24, overflow:"hidden", cursor:dragging?"grabbing":"grab",
            border:"1px solid "+T.glassBorder,
            boxShadow:"0 30px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)",
            transform: exitDir ? "translateX("+(exitDir==="right"?500:-500)+"px) rotate("+(exitDir==="right"?25:-25)+"deg)"
              : "translateX("+dragX+"px) rotate("+(dragX*0.07)+"deg)",
            transition: dragging ? "none" : "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            userSelect:"none",
          }}>
          <div style={{ width:"100%", height:"100%",
            background: current.avatar_url ? "url("+current.avatar_url+") center/cover" : "linear-gradient(160deg, "+T.flame+"36, "+T.sunset+"26 45%, "+T.violet+"1f)",
            position:"relative", display:"flex", flexDirection:"column" }}>
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 45%, transparent 70%)" }} />
            <div style={{ position:"absolute", top:28, left:20, padding:"6px 18px", border:"3px solid "+T.mint, zIndex:2,
              borderRadius:8, transform:"rotate(-15deg)", opacity:likeOp, color:T.mint, fontWeight:800, fontSize:24, letterSpacing:2 }}>LET'S GO</div>
            <div style={{ position:"absolute", top:28, right:20, padding:"6px 18px", border:"3px solid "+T.rose, zIndex:2,
              borderRadius:8, transform:"rotate(15deg)", opacity:nopeOp, color:T.rose, fontWeight:800, fontSize:24, letterSpacing:2 }}>NOPE</div>
            <div style={{ position:"absolute", top:14, right:14, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(10px)", zIndex:2,
              borderRadius:12, padding:"5px 11px", display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ color:matchColor, fontWeight:700, fontSize:13 }}>{compat}%</span>
              <span style={{ fontSize:10, color:T.mist }}>match</span>
            </div>

            {/* Avatar zone: a framed circle in its own space, never overlapping text. */}
            {!current.avatar_url && <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
              <div style={{ width:104, height:104, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:54, background:"rgba(255,255,255,0.08)", border:"2px solid "+T.flame+"55",
                boxShadow:"0 0 40px "+T.flame+"33" }}>{displayAvatar}</div>
            </div>}
            {current.avatar_url && <div style={{ flex:1 }} />}

            {/* Info panel */}
            <div style={{ position:"relative", padding:"14px 18px 18px" }}>
              <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:7 }}>
                <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:25, fontWeight:700 }}>{displayName}{displayAge ? ", "+displayAge : ""}</h2>
                {current.verified && <VerifiedBadge size={18} />}
                <span style={{ fontSize:11, color:T.mist }}>{displayCity}</span>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:9 }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:6, whiteSpace:"nowrap",
                  background:"linear-gradient(135deg, "+T.flame+"cc, "+T.sunset+"cc)", borderRadius:18, padding:"4px 13px", fontSize:12, fontWeight:600 }}>
                  {displayDestEmoji} {displayDest}
                </span>
                {displayDates && <span style={{ display:"inline-flex", alignItems:"center", whiteSpace:"nowrap",
                  background:"rgba(0,0,0,0.45)", border:"1px solid rgba(255,255,255,0.14)", borderRadius:18, padding:"4px 12px", fontSize:11, color:T.cloud }}>
                  📅 {displayDates}
                </span>}
              </div>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.82)", lineHeight:1.5, marginBottom:9,
                display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{displayBio}</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {displayInterests.slice(0,4).map(function(i){ return <span key={i} style={{ background:"rgba(255,255,255,0.12)", borderRadius:10, padding:"2px 9px", fontSize:10, color:T.cloud }}>{i}</span>; })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:18 }}>
        <button onClick={function(){swipe("left")}} title="Pass (←)" style={actionBtnStyle(T.rose)}>✕</button>
        <button onClick={function(){setShowDetails(true)}} title="Details (↑)" style={{ ...actionBtnStyle(T.sky), width:46, height:46, fontSize:18 }}>ⓘ</button>
        <button onClick={function(){swipe("right")}} title="Let's go (→)" style={actionBtnStyle(T.mint)}>✈</button>
      </div>
      <p style={{ textAlign:"center", fontSize:9, color:T.ash, marginTop:-6 }}>← pass · tap card for details · like →</p>
    </div>

    {showDetails && <div onClick={function(){setShowDetails(false)}} style={{ position:"fixed", inset:0, zIndex:70,
      background:"rgba(0,0,0,0.62)", display:"flex", alignItems:"flex-end", justifyContent:"center", animation:"fadeIn 0.2s" }}>
      <div onClick={function(e){e.stopPropagation()}} style={{ width:"100%", maxWidth:480, background:T.ink,
        borderRadius:"22px 22px 0 0", padding:"12px 18px 24px", maxHeight:"82vh", overflow:"auto",
        animation:"slideSheet 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ width:36, height:4, borderRadius:2, background:T.slate, margin:"0 auto 14px" }} />
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <div style={{ width:44, height:44, borderRadius:"50%", background:T.charcoal, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{displayAvatar}</div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:19 }}>{displayName}{displayAge ? ", "+displayAge : ""}</h2>
              {current.verified && <VerifiedBadge size={15} />}
            </div>
            {displayCity && <p style={{ fontSize:11, color:T.ash }}>📍 {displayCity}</p>}
          </div>
          <div style={{ textAlign:"center", background:T.mint+"18", borderRadius:12, padding:"6px 12px" }}>
            <div style={{ color:T.mint, fontWeight:800, fontSize:17 }}>{compat}%</div>
            <div style={{ fontSize:8, color:T.mist }}>match</div>
          </div>
        </div>

        {displayDest && <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"linear-gradient(135deg,"+T.flame+"cc,"+T.sunset+"cc)", borderRadius:16, padding:"4px 12px", marginTop:8 }}>
          <span>{displayDestEmoji}</span><span style={{ fontSize:12, fontWeight:600 }}>{displayDest}</span>
          {displayDates && <span style={{ fontSize:10, opacity:0.85 }}>· {displayDates}</span>}
        </div>}

        <h3 style={{ fontSize:10, color:T.ash, textTransform:"uppercase", letterSpacing:2, margin:"16px 0 8px" }}>Why you match</h3>
        {reasons.map(function(r,i){
          return <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", marginBottom:6,
            borderRadius:12, background:T.glass, border:"1px solid "+T.glassBorder }}>
            <span style={{ fontSize:16 }}>{r.icon}</span>
            <span style={{ fontSize:12, color:T.cloud }}>{r.text}</span>
          </div>;
        })}

        {displayBio && <>
          <h3 style={{ fontSize:10, color:T.ash, textTransform:"uppercase", letterSpacing:2, margin:"16px 0 8px" }}>About</h3>
          <p style={{ fontSize:12.5, color:T.mist, lineHeight:1.6 }}>{displayBio}</p>
        </>}

        {displayInterests.length > 0 && <>
          <h3 style={{ fontSize:10, color:T.ash, textTransform:"uppercase", letterSpacing:2, margin:"16px 0 8px" }}>Interests</h3>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {displayInterests.map(function(it){
              var shared = (meProfile.interests || []).indexOf(it) !== -1;
              return <span key={it} style={{ borderRadius:12, padding:"4px 11px", fontSize:11,
                background: shared ? T.mint+"22" : "rgba(255,255,255,0.08)", color: shared ? T.mint : T.cloud,
                border:"1px solid "+(shared ? T.mint+"44" : "transparent") }}>{shared ? "✓ " : ""}{it}</span>;
            })}
          </div>
        </>}

        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={function(){setShowDetails(false); swipe("left");}} style={{ flex:1, padding:13, borderRadius:14, border:"1px solid "+T.rose+"44", background:T.rose+"12", color:T.rose, fontSize:13, fontWeight:600, cursor:"pointer" }}>✕ Pass</button>
          <button onClick={function(){setShowDetails(false); swipe("right");}} style={{ flex:1, padding:13, borderRadius:14, border:"none", background:"linear-gradient(135deg,"+T.mint+","+T.lime+")", color:T.midnight, fontSize:13, fontWeight:700, cursor:"pointer" }}>✈ Let's go</button>
        </div>
      </div>
    </div>}
  </div>;
}

function actionBtnStyle(color) {
  return { width:58, height:58, borderRadius:"50%", border:"1.5px solid "+color+"55",
    background:"radial-gradient(circle at 50% 35%, "+color+"22, "+color+"10)",
    color:color, cursor:"pointer", fontSize:23, display:"flex", alignItems:"center", justifyContent:"center",
    boxShadow:"0 8px 24px "+color+"33", backdropFilter:"blur(6px)" };
}
