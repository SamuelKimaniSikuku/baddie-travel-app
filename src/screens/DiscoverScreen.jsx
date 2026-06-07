import { useState, useRef } from "react";
import { T } from "../theme";
import { TRAVELERS } from "../data/mock";
import { useDiscovery } from "../hooks/useSupabase";
import { isDemo } from "../lib/supabase";
import { profilesService } from "../services/profiles";
import { calcCompatibility as calcCompat } from "../lib/compatibility";
import VerifiedBadge from "../ui/VerifiedBadge";

export default function DiscoverScreen({ onMatch, matches, userId, userProfile }) {
  var discovery = useDiscovery(isDemo ? null : userId);
  var [demoCards, setDemoCards] = useState(function(){ return TRAVELERS.filter(function(t){ return !matches.find(function(m){return m.id===t.id}); }); });
  var [dragging, setDragging] = useState(false);
  var [dragX, setDragX] = useState(0);
  var [exitDir, setExitDir] = useState(null);
  var startX = useRef(0);

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

  function onStart(x) { setDragging(true); startX.current = x; }
  function onMove(x) { if (dragging) setDragX(x - startX.current); }
  function onEnd() {
    setDragging(false);
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

  var compat = userProfile ? profilesService.calcCompatibility(userProfile, current) : calcCompat({vibe:"Adventurous",budget:"Mid-range",interests:["Hiking","Food","Photography"]}, current);

  return <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 16px 12px", overflow:"hidden" }}>
    <div style={{ flex:1, position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
      {(isDemo ? demoCards.slice(-3,-1) : []).map(function(c,i){
        return <div key={c.id} style={{ position:"absolute", width:"100%", maxWidth:360, aspectRatio:"3/4.2",
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
          position:"absolute", width:"100%", maxWidth:360, aspectRatio:"3/4.2",
          borderRadius:22, overflow:"hidden", cursor:dragging?"grabbing":"grab",
          transform: exitDir ? "translateX("+(exitDir==="right"?500:-500)+"px) rotate("+(exitDir==="right"?25:-25)+"deg)"
            : "translateX("+dragX+"px) rotate("+(dragX*0.07)+"deg)",
          transition: dragging ? "none" : "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          userSelect:"none",
        }}>
        <div style={{ width:"100%", height:"100%",
          background: current.avatar_url ? "url("+current.avatar_url+") center/cover" : "linear-gradient(135deg, "+T.flame+"40, "+T.sunset+"30, "+T.violet+"20)",
          position:"relative", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent)" }} />
          <div style={{ position:"absolute", top:28, left:20, padding:"6px 18px", border:"3px solid "+T.mint,
            borderRadius:8, transform:"rotate(-15deg)", opacity:likeOp, color:T.mint, fontWeight:800, fontSize:24, letterSpacing:2 }}>LET'S GO</div>
          <div style={{ position:"absolute", top:28, right:20, padding:"6px 18px", border:"3px solid "+T.rose,
            borderRadius:8, transform:"rotate(15deg)", opacity:nopeOp, color:T.rose, fontWeight:800, fontSize:24, letterSpacing:2 }}>NOPE</div>
          {!current.avatar_url && <div style={{ position:"absolute", top:"30%", left:"50%", transform:"translateX(-50%)", fontSize:80 }}>{displayAvatar}</div>}
          <div style={{ position:"absolute", top:14, right:14, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(10px)",
            borderRadius:12, padding:"5px 11px", display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ color:T.mint, fontWeight:700, fontSize:13 }}>{compat}%</span>
            <span style={{ fontSize:10, color:T.mist }}>match</span>
          </div>
          <div style={{ position:"relative", padding:"20px 18px" }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:4 }}>
              <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:700 }}>{displayName}{displayAge ? ", "+displayAge : ""}</h2>
              {current.verified && <VerifiedBadge size={18} />}
              <span style={{ fontSize:11, color:T.mist }}>{displayCity}</span>
            </div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6,
              background:"linear-gradient(135deg, "+T.flame+"cc, "+T.sunset+"cc)", borderRadius:18, padding:"4px 13px", marginBottom:8 }}>
              <span>{displayDestEmoji}</span>
              <span style={{ fontSize:12, fontWeight:600 }}>{displayDest}</span>
              <span style={{ fontSize:10, opacity:0.8 }}>· {displayDates}</span>
            </div>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.8)", lineHeight:1.5, marginBottom:8 }}>{displayBio}</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {displayInterests.slice(0,4).map(function(i){ return <span key={i} style={{ background:"rgba(255,255,255,0.12)", borderRadius:10, padding:"2px 9px", fontSize:10, color:T.cloud }}>{i}</span>; })}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div style={{ display:"flex", justifyContent:"center", gap:18, paddingBottom:4 }}>
      <button onClick={function(){swipe("left")}} style={actionBtnStyle(T.rose)}>✕</button>
      <button onClick={function(){swipe("right")}} style={actionBtnStyle(T.mint)}>✈</button>
    </div>
  </div>;
}

function actionBtnStyle(color) {
  return { width:56, height:56, borderRadius:"50%", border:"2px solid "+color+"44", background:color+"15",
    color:color, cursor:"pointer", fontSize:22, display:"flex", alignItems:"center", justifyContent:"center" };
}
