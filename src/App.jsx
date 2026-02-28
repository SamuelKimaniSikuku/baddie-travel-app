import { useState, useEffect, useRef, useCallback } from "react";

// ══════════════════════════════════════════════════════════════
// BADDIE — Fully Integrated Travel App
// Auth → Discover → Match → Chat (with sharing) → Trip Planner
// ══════════════════════════════════════════════════════════════

var isDemo = true; // Set false when Supabase is connected

// ─── Design Tokens ───────────────────────────────────────────
var T = {
  flame:"#FF4136", coral:"#FF6B5A", sunset:"#FF8C42", gold:"#FFB830",
  midnight:"#0A0A14", ink:"#14142B", charcoal:"#1E1E32", slate:"#2D2D48",
  ash:"#6E6E8A", mist:"#A0A0BE", cloud:"#E8E8F0", snow:"#F5F5FA",
  white:"#FFFFFF", mint:"#00D4AA", electric:"#5B5BFF", rose:"#FF3B6F",
  sky:"#38BDF8", violet:"#A78BFA", lime:"#84CC16",
  glass:"rgba(255,255,255,0.06)", glassBorder:"rgba(255,255,255,0.1)",
};

var CATEGORY_ICONS = {
  flight:"✈️", transport:"🚕", accommodation:"🏨", food:"🍜",
  activity:"🎯", sightseeing:"📸", shopping:"🛍️", nightlife:"🌙",
  relaxation:"🧘", other:"📌", insurance:"🛡️", visa:"📄", tips:"💰",
};
var CATEGORY_COLORS = {
  flight:T.sky, transport:T.electric, accommodation:T.violet, food:T.sunset,
  activity:T.mint, sightseeing:T.coral, shopping:T.rose, nightlife:T.violet,
  relaxation:T.mint, other:T.ash,
};

// ─── Mock Data ───────────────────────────────────────────────
var TRAVELERS = [
  { id:"d1", name:"Sofia", age:26, avatar:"\ud83e\uddd5", verified:true, city:"Barcelona", destination:"Bali", destEmoji:"\ud83c\uddf3\ud83c\udde9", dates:"Mar 15 - Apr 2", bio:"Yoga retreats, sunrise hikes, and street food adventures.", vibe:"Adventurous", budget:"Mid-range", interests:["Yoga","Hiking","Food","Photography"], compatibility:94 },
  { id:"d2", name:"Marcus", age:29, avatar:"\ud83d\udc68\ud83c\udfbe", verified:true, city:"London", destination:"Tokyo", destEmoji:"\ud83c\uddef\ud83c\uddf5", dates:"Apr 5 - Apr 20", bio:"Anime nerd meets foodie. Ramen shops and arcade adventures.", vibe:"Cultural", budget:"Flexible", interests:["Anime","Ramen","Nightlife","Sneakers"], compatibility:87 },
  { id:"d3", name:"Ayla", age:24, avatar:"\ud83d\udc69\ud83c\udffc", verified:false, city:"Istanbul", destination:"Morocco", destEmoji:"\ud83c\uddf2\ud83c\udde6", dates:"May 1 - May 14", bio:"Photographer chasing golden hour. Lets get lost in the medinas.", vibe:"Creative", budget:"Budget", interests:["Photography","Art","Tea","Architecture"], compatibility:91 },
  { id:"d4", name:"Kai", age:31, avatar:"\ud83d\udc68\ud83c\udffd", verified:true, city:"Auckland", destination:"Patagonia", destEmoji:"\ud83c\udde6\ud83c\uddf7", dates:"Jun 10 - Jul 1", bio:"Mountaineer & trail runner. Planning the W Trek.", vibe:"Extreme", budget:"Mid-range", interests:["Trekking","Camping","Wildlife","Climbing"], compatibility:78 },
  { id:"d5", name:"Priya", age:27, avatar:"\ud83d\udc69\ud83c\udffd", verified:true, city:"Mumbai", destination:"Greece", destEmoji:"\ud83c\uddec\ud83c\uddf7", dates:"Jul 5 - Jul 18", bio:"Island hopping, sunset cocktails, and ancient ruins.", vibe:"Social", budget:"Luxury", interests:["Islands","History","Cocktails","Sailing"], compatibility:85 },
  { id:"d6", name:"Liam", age:28, avatar:"\ud83e\uddd1\ud83c\udffb", verified:true, city:"Dublin", destination:"Vietnam", destEmoji:"\ud83c\uddfb\ud83c\uddf3", dates:"Aug 1 - Aug 20", bio:"Backpacker with a coffee addiction.", vibe:"Adventurous", budget:"Budget", interests:["Coffee","Motorbikes","Street Food"], compatibility:82 },
];

var REPLIES = [
  "That sounds amazing!","I'm so down!","Checking flights now ✈️",
  "Great find! Saving this 📌","What's your budget?",
  "Let me send you the itinerary 📋","Can't wait!! 🔥",
  "We should split an Airbnb!","Just booked my hostel! 🏠",
  "Let's do it! This trip is going to be epic ✈️",
];

var user = { avatar:"\ud83d\ude0e", name:"You", vibe:"Adventurous", budget:"Mid-range", interests:["Hiking","Food","Photography"] };

function calcCompat(me, them) {
  var s = 50;
  if (me.vibe === them.vibe) s += 20;
  if (me.budget === them.budget) s += 10;
  s += (me.interests || []).filter(function(i) { return them.interests.includes(i); }).length * 8;
  return Math.min(s, 99);
}

// ─── Helpers ─────────────────────────────────────────────────
function formatDate(d) { return new Date(d).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}); }
function formatTime(t) { var p=t.split(":"); var h=parseInt(p[0]); return (h>12?h-12:h)+":"+p[1]+" "+(h>=12?"PM":"AM"); }
function getDuration(dep,arr) { var d=new Date(arr)-new Date(dep); return Math.floor(d/3600000)+"h "+Math.floor((d%3600000)/60000)+"m"; }
function getCountdown(dateStr) {
  var diff = new Date(dateStr) - new Date();
  if (diff <= 0) return { days:0, hours:0, mins:0 };
  return { days:Math.floor(diff/86400000), hours:Math.floor((diff%86400000)/3600000), mins:Math.floor((diff%3600000)/60000) };
}

// ─── CSS ─────────────────────────────────────────────────────
var css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Fraunces:ital,wght@0,700;0,900;1,700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
html,body,#root{height:100%;overflow:hidden;}
body{font-family:'Sora',sans-serif;background:${T.midnight};color:${T.white};}
::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:${T.slate};border-radius:3px;}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideInR{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
@keyframes slideInL{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
@keyframes popIn{from{opacity:0;transform:scale(0.7) rotate(-10deg)}60%{transform:scale(1.1) rotate(2deg)}to{opacity:1;transform:scale(1) rotate(0)}}
@keyframes confetti{0%{transform:translateY(-100vh) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
@keyframes typing{0%,60%{opacity:.3}30%{opacity:1}}
@keyframes slideSheet{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
input,textarea,button,select{font-family:'Sora',sans-serif;}
`;

// ─── Shared Components ───────────────────────────────────────
function Glass({ children, style, onClick }) {
  return <div onClick={onClick} style={{
    background:T.glass, backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
    border:"1px solid "+T.glassBorder, borderRadius:16, ...style
  }}>{children}</div>;
}

// ══════════════════════════════════════════════════════════════
// AUTH SCREEN
// ══════════════════════════════════════════════════════════════
function AuthScreen({ onLogin }) {
  var _m = useState("splash"), mode = _m[0], setMode = _m[1];
  var _e = useState(""), email = _e[0], setEmail = _e[1];
  var _p = useState(""), pw = _p[0], setPw = _p[1];
  var _n = useState(""), name = _n[0], setName = _n[1];
  var _l = useState(false), loading = _l[0], setLoading = _l[1];

  useEffect(function() { var t = setTimeout(function(){ setMode("login"); }, 2200); return function(){ clearTimeout(t); }; }, []);

  function submit() { setLoading(true); setTimeout(function(){ onLogin({ name: name||"Traveler", email: email }); }, 1000); }

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

  var isSignup = mode === "signup";
  var inputSt = { width:"100%", padding:"13px 16px", borderRadius:14, border:"1px solid "+T.glassBorder, background:T.glass, color:T.white, fontSize:14, outline:"none" };

  return <div style={{ height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24,
    background:"radial-gradient(ellipse at 20% 0%, "+T.flame+"12 0%, transparent 50%), "+T.midnight, animation:"fadeIn 0.5s ease" }}>
    <div style={{ width:"100%", maxWidth:380 }}>
      <div style={{ textAlign:"center", marginBottom:40, animation:"fadeInUp 0.5s ease" }}>
        <div style={{ fontSize:36, marginBottom:8 }}>✈️</div>
        <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:32, fontWeight:900,
          background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>baddie</h1>
        <p style={{ color:T.ash, fontSize:12, marginTop:6 }}>{isSignup?"Create your account":"Welcome back, traveler"}</p>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12, animation:"fadeInUp 0.5s ease 0.1s both" }}>
        {isSignup && <input value={name} onChange={function(e){setName(e.target.value)}} placeholder="Your name" style={inputSt} />}
        <input value={email} onChange={function(e){setEmail(e.target.value)}} placeholder="Email" type="email" style={inputSt} />
        <input value={pw} onChange={function(e){setPw(e.target.value)}} placeholder="Password" type="password" style={inputSt} />
        <button onClick={submit} disabled={loading} style={{
          width:"100%", padding:"14px", borderRadius:14, border:"none",
          background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", color:T.white,
          fontSize:15, fontWeight:600, cursor:"pointer", boxShadow:"0 4px 24px "+T.flame+"44"
        }}>{loading?"Taking off... ✈️":isSignup?"Create Account":"Sign In"}</button>
      </div>
      <p style={{ textAlign:"center", marginTop:28, fontSize:13, color:T.ash }}>
        {isSignup?"Already have an account? ":"New to Baddie? "}
        <span onClick={function(){setMode(isSignup?"login":"signup")}} style={{ color:T.coral, cursor:"pointer", fontWeight:600 }}>
          {isSignup?"Sign in":"Create account"}
        </span>
      </p>
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// DISCOVER SCREEN (Swipe Cards)
// ══════════════════════════════════════════════════════════════
function DiscoverScreen({ onMatch, matches }) {
  var _c = useState(function(){ return TRAVELERS.filter(function(t){ return !matches.find(function(m){return m.id===t.id}); }); });
  var cards = _c[0], setCards = _c[1];
  var _d = useState(false), dragging = _d[0], setDragging = _d[1];
  var _dx = useState(0), dragX = _dx[0], setDragX = _dx[1];
  var _ex = useState(null), exitDir = _ex[0], setExitDir = _ex[1];
  var startX = useRef(0);

  var current = cards[cards.length - 1];
  var likeOp = Math.min(1, Math.max(0, dragX / 100));
  var nopeOp = Math.min(1, Math.max(0, -dragX / 100));

  function onStart(x) { setDragging(true); startX.current = x; }
  function onMove(x) { if (dragging) setDragX(x - startX.current); }
  function onEnd() {
    setDragging(false);
    if (Math.abs(dragX) > 110) { swipe(dragX > 0 ? "right" : "left"); }
    else { setDragX(0); }
  }
  function swipe(dir) {
    setExitDir(dir);
    setTimeout(function() {
      if (dir === "right" && current) onMatch(current);
      setCards(function(p){ return p.slice(0,-1); });
      setExitDir(null); setDragX(0);
    }, 300);
  }

  if (!current) return <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
    <div style={{ fontSize:56, marginBottom:12 }}>🌍</div>
    <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:22 }}>No more travelers</h2>
    <p style={{ color:T.ash, marginTop:8, textAlign:"center" }}>Check back soon for new travel buddies!</p>
  </div>;

  var compat = calcCompat(user, current);

  return <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 16px 12px", overflow:"hidden" }}>
    <div style={{ flex:1, position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
      {cards.slice(-3,-1).map(function(c,i){
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
        <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg, "+T.flame+"40, "+T.sunset+"30, "+T.violet+"20)",
          position:"relative", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent)" }} />

          {/* Stamps */}
          <div style={{ position:"absolute", top:28, left:20, padding:"6px 18px", border:"3px solid "+T.mint,
            borderRadius:8, transform:"rotate(-15deg)", opacity:likeOp, color:T.mint, fontWeight:800, fontSize:24, letterSpacing:2 }}>LET'S GO</div>
          <div style={{ position:"absolute", top:28, right:20, padding:"6px 18px", border:"3px solid "+T.rose,
            borderRadius:8, transform:"rotate(15deg)", opacity:nopeOp, color:T.rose, fontWeight:800, fontSize:24, letterSpacing:2 }}>NOPE</div>

          {/* Avatar */}
          <div style={{ position:"absolute", top:"30%", left:"50%", transform:"translateX(-50%)", fontSize:80 }}>{current.avatar}</div>

          {/* Compat badge */}
          <div style={{ position:"absolute", top:14, right:14, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(10px)",
            borderRadius:12, padding:"5px 11px", display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ color:T.mint, fontWeight:700, fontSize:13 }}>{compat}%</span>
            <span style={{ fontSize:10, color:T.mist }}>match</span>
          </div>

          {/* Info */}
          <div style={{ position:"relative", padding:"20px 18px" }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:4 }}>
              <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:700 }}>{current.name}, {current.age}</h2>
              <span style={{ fontSize:11, color:T.mist }}>{current.city}</span>
            </div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6,
              background:"linear-gradient(135deg, "+T.flame+"cc, "+T.sunset+"cc)", borderRadius:18, padding:"4px 13px", marginBottom:8 }}>
              <span>{current.destEmoji}</span>
              <span style={{ fontSize:12, fontWeight:600 }}>{current.destination}</span>
              <span style={{ fontSize:10, opacity:0.8 }}>· {current.dates}</span>
            </div>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.8)", lineHeight:1.5, marginBottom:8 }}>{current.bio}</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {current.interests.slice(0,4).map(function(i){ return <span key={i} style={{ background:"rgba(255,255,255,0.12)", borderRadius:10, padding:"2px 9px", fontSize:10, color:T.cloud }}>{i}</span>; })}
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

// ══════════════════════════════════════════════════════════════
// MATCH OVERLAY
// ══════════════════════════════════════════════════════════════
function MatchOverlay({ match, onMessage, onClose }) {
  var colors = [T.flame,T.sunset,T.gold,T.mint,T.electric,T.rose];
  return <div style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.92)", backdropFilter:"blur(20px)",
    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", animation:"fadeIn 0.3s" }}>
    {Array.from({length:20}).map(function(_,i){
      return <div key={i} style={{ position:"absolute", top:-20, left:Math.random()*100+"%",
        width:8, height:8, borderRadius:Math.random()>0.5?"50%":"2px", background:colors[i%6],
        animation:"confetti "+(2+Math.random()*2)+"s linear "+(Math.random()*0.5)+"s infinite" }} />;
    })}
    <div style={{ animation:"popIn 0.6s cubic-bezier(0.34,1.56,0.64,1)", textAlign:"center" }}>
      <div style={{ fontSize:52, marginBottom:8 }}>✈️</div>
      <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:38, fontWeight:900,
        background:"linear-gradient(135deg,"+T.flame+","+T.gold+")", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>It's a Trip!</h1>
      <p style={{ color:T.mist, fontSize:13, marginBottom:28 }}>You and {match.name} want to explore {match.destination} {match.destEmoji}</p>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:20, marginBottom:36 }}>
        <div style={{ width:80, height:80, borderRadius:"50%", border:"3px solid "+T.flame,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, background:T.charcoal }}>{user.avatar}</div>
        <div style={{ fontSize:24 }}>❤️</div>
        <div style={{ width:80, height:80, borderRadius:"50%", border:"3px solid "+T.sunset,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, background:T.charcoal }}>{match.avatar}</div>
      </div>
      <button onClick={onMessage} style={{ width:240, padding:"13px", borderRadius:14, border:"none",
        background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", color:T.white, fontSize:14, fontWeight:600, cursor:"pointer", marginBottom:10 }}>Send a Message 💬</button>
      <br/>
      <button onClick={onClose} style={{ width:240, padding:"13px", borderRadius:14, border:"1px solid "+T.glassBorder,
        background:T.glass, color:T.white, fontSize:14, fontWeight:500, cursor:"pointer" }}>Keep Swiping</button>
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// CHATS LIST SCREEN
// ══════════════════════════════════════════════════════════════
function ChatsListScreen({ matches, onOpenChat }) {
  var _s = useState(""), search = _s[0], setSearch = _s[1];
  var filtered = matches.filter(function(m){ return m.name.toLowerCase().includes(search.toLowerCase()); });

  return <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
    <div style={{ padding:"0 16px 10px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, background:T.glass, border:"1px solid "+T.glassBorder, borderRadius:14, padding:"10px 14px" }}>
        <span style={{ color:T.ash }}>🔍</span>
        <input value={search} onChange={function(e){setSearch(e.target.value)}} placeholder="Search chats..."
          style={{ flex:1, background:"none", border:"none", outline:"none", color:T.white, fontSize:13 }} />
      </div>
    </div>
    <div style={{ flex:1, overflow:"auto", padding:"0 16px" }}>
      {filtered.length === 0 ? <div style={{ textAlign:"center", padding:40 }}>
        <div style={{ fontSize:44, marginBottom:10 }}>💬</div>
        <h3 style={{ fontFamily:"'Fraunces',serif" }}>No chats yet</h3>
        <p style={{ color:T.ash, fontSize:12 }}>Match with travelers to start chatting!</p>
      </div> : filtered.map(function(m, i) {
        return <div key={m.id} onClick={function(){onOpenChat(m)}} style={{
          display:"flex", alignItems:"center", gap:12, padding:"13px 0",
          borderBottom:"1px solid "+T.glass, cursor:"pointer",
          animation:"fadeInUp 0.3s ease "+(i*0.04)+"s both"
        }}>
          <div style={{ width:48, height:48, borderRadius:"50%", background:T.charcoal, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:24, border:"2px solid "+T.glassBorder, position:"relative" }}>
            {m.avatar}
            <div style={{ position:"absolute", bottom:0, right:0, width:12, height:12, borderRadius:"50%", background:T.mint, border:"2px solid "+T.midnight }} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
              <span style={{ fontWeight:600, fontSize:14 }}>{m.name}</span>
              <span style={{ color:T.ash, fontSize:10 }}>Now</span>
            </div>
            <p style={{ color:T.mist, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>Matched! Say hi 👋</p>
          </div>
          <div style={{ background:"linear-gradient(135deg,"+T.flame+"44,"+T.sunset+"44)", borderRadius:8, padding:"3px 8px", fontSize:10, color:T.coral }}>
            {m.destEmoji} {m.destination}
          </div>
        </div>;
      })}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// CHAT DETAIL with SHARING (integrated)
// ══════════════════════════════════════════════════════════════
var SHARE_OPTIONS = [
  { id:"flight", icon:"✈️", label:"Flight", color:T.sky },
  { id:"itinerary", icon:"📋", label:"Day Plan", color:T.mint },
  { id:"expense", icon:"💰", label:"Expense", color:T.gold },
  { id:"poll", icon:"📊", label:"Poll", color:T.violet },
  { id:"packing", icon:"🎒", label:"Packing", color:T.coral },
  { id:"checklist", icon:"✅", label:"Checklist", color:T.lime },
  { id:"location", icon:"📍", label:"Location", color:T.rose },
];

function FlightCard({ data, isMine }) {
  return <div style={{ borderRadius:14, overflow:"hidden", width:250,
    background:isMine?"rgba(255,65,54,0.08)":"rgba(255,255,255,0.05)", border:"1px solid "+(isMine?T.flame+"33":T.glassBorder) }}>
    <div style={{ padding:"7px 11px", display:"flex", alignItems:"center", justifyContent:"space-between",
      background:T.sky+"12", borderBottom:"1px solid "+T.glassBorder }}>
      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
        <span style={{ fontSize:13 }}>✈️</span>
        <span style={{ fontSize:10, fontWeight:600 }}>{data.airline}</span>
        <span style={{ fontSize:9, color:T.ash }}>{data.flight_number}</span>
      </div>
      <span style={{ fontSize:8, padding:"2px 7px", borderRadius:6, fontWeight:600,
        background:T.gold+"22", color:T.gold, textTransform:"uppercase" }}>{data.status||"found"}</span>
    </div>
    <div style={{ padding:10 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:16, fontWeight:800, fontFamily:"'Fraunces',serif" }}>{data.from}</div>
          <div style={{ fontSize:8, color:T.ash }}>{data.fromCity}</div>
        </div>
        <div style={{ flex:1, margin:"0 8px", height:1, background:T.mist+"44", position:"relative" }}>
          <div style={{ position:"absolute", left:"50%", transform:"translateX(-50%)", fontSize:8, color:T.mist, background:T.midnight, padding:"0 4px" }}>{data.duration||"—"}</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:16, fontWeight:800, fontFamily:"'Fraunces',serif" }}>{data.to}</div>
          <div style={{ fontSize:8, color:T.ash }}>{data.toCity}</div>
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10 }}>
        <span style={{ color:T.mist }}>{data.date||""}</span>
        <span style={{ fontWeight:700, color:T.gold }}>${data.price}</span>
      </div>
    </div>
    <button style={{ width:"100%", padding:7, border:"none", borderTop:"1px solid "+T.glassBorder,
      background:"transparent", color:T.sky, fontSize:10, fontWeight:600, cursor:"pointer" }}>📌 Save to Trip</button>
  </div>;
}

function PollCard({ data, onVote }) {
  var total = data.options.reduce(function(s,o){ return s+o.votes.length; }, 0);
  return <div style={{ borderRadius:14, overflow:"hidden", width:250, background:"rgba(255,255,255,0.05)", border:"1px solid "+T.glassBorder }}>
    <div style={{ padding:"7px 11px", background:T.violet+"12", borderBottom:"1px solid "+T.glassBorder }}>
      <span style={{ fontSize:11, fontWeight:600 }}>📊 {data.question}</span>
    </div>
    <div style={{ padding:"6px 10px", display:"flex", flexDirection:"column", gap:5 }}>
      {data.options.map(function(opt) {
        var pct = total > 0 ? (opt.votes.length/total)*100 : 0;
        var voted = opt.votes.includes("me");
        return <div key={opt.id} onClick={function(){onVote&&onVote(opt.id)}} style={{
          position:"relative", padding:"7px 10px", borderRadius:8, cursor:"pointer",
          border:"1px solid "+(voted?T.violet+"66":T.glassBorder), overflow:"hidden" }}>
          <div style={{ position:"absolute", left:0, top:0, bottom:0, width:pct+"%",
            background:voted?T.violet+"20":T.white+"06", transition:"width 0.4s", borderRadius:8 }} />
          <div style={{ position:"relative", display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:11 }}>{opt.text}</span>
            <span style={{ fontSize:9, fontWeight:600, color:voted?T.violet:T.ash }}>{Math.round(pct)}%</span>
          </div>
        </div>;
      })}
    </div>
    <div style={{ padding:"5px 10px", borderTop:"1px solid "+T.glassBorder, fontSize:9, color:T.ash, textAlign:"center" }}>{total} votes</div>
  </div>;
}

function ItineraryCard({ data }) {
  return <div style={{ borderRadius:14, overflow:"hidden", width:250, background:"rgba(255,255,255,0.05)", border:"1px solid "+T.glassBorder }}>
    <div style={{ padding:"7px 11px", background:T.mint+"12", borderBottom:"1px solid "+T.glassBorder, display:"flex", justifyContent:"space-between" }}>
      <span style={{ fontSize:11, fontWeight:600 }}>📋 {data.title}</span>
      <span style={{ fontSize:9, color:T.ash }}>{data.date}</span>
    </div>
    <div style={{ padding:"4px 0" }}>
      {data.activities.map(function(a,i){
        return <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 11px" }}>
          <span style={{ fontSize:9, color:T.mist, minWidth:34, fontWeight:500 }}>{a.time}</span>
          <span style={{ fontSize:12 }}>{a.icon}</span>
          <span style={{ fontSize:10, flex:1 }}>{a.title}</span>
          {a.cost>0&&<span style={{ fontSize:9, color:T.gold }}>${a.cost}</span>}
        </div>;
      })}
    </div>
  </div>;
}

function ExpenseCard({ data }) {
  return <div style={{ borderRadius:14, overflow:"hidden", width:250, background:"rgba(255,255,255,0.05)", border:"1px solid "+T.glassBorder }}>
    <div style={{ padding:"7px 11px", background:T.gold+"12", borderBottom:"1px solid "+T.glassBorder }}>
      <span style={{ fontSize:11, fontWeight:600 }}>💰 {data.title}</span>
    </div>
    <div style={{ padding:"4px 0" }}>
      {data.items.map(function(item,i){
        return <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 11px" }}>
          <span style={{ fontSize:12 }}>{item.icon}</span>
          <span style={{ fontSize:10, flex:1 }}>{item.label}</span>
          <span style={{ fontSize:10, fontWeight:600, color:T.gold }}>${item.amount}</span>
        </div>;
      })}
    </div>
    <div style={{ padding:"8px 11px", borderTop:"1px solid "+T.glassBorder, background:T.gold+"08",
      display:"flex", justifyContent:"space-between" }}>
      <span style={{ fontSize:11, fontWeight:700 }}>Total: <span style={{ color:T.gold }}>${data.total}</span></span>
      <span style={{ fontSize:10, color:T.mint }}>${data.perPerson}/person</span>
    </div>
  </div>;
}

function ChecklistCard({ data }) {
  return <div style={{ borderRadius:14, overflow:"hidden", width:250, background:"rgba(255,255,255,0.05)", border:"1px solid "+T.glassBorder }}>
    <div style={{ padding:"7px 11px", background:T.lime+"12", borderBottom:"1px solid "+T.glassBorder }}>
      <span style={{ fontSize:11, fontWeight:600 }}>✅ {data.title}</span>
    </div>
    <div style={{ padding:"4px 10px" }}>
      {data.items.map(function(item,i){
        return <div key={i} style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 0" }}>
          <span style={{ fontSize:11 }}>{item.done?"✅":"⬜"}</span>
          <span style={{ fontSize:10, color:item.done?T.ash:T.white, textDecoration:item.done?"line-through":"none" }}>{item.text}</span>
        </div>;
      })}
    </div>
  </div>;
}

function ShareSheet({ onClose, onShare }) {
  var _sel = useState(null), selected = _sel[0], setSelected = _sel[1];
  var _fd = useState({airline:"",flight_number:"",from:"",fromCity:"",to:"",toCity:"",price:"",date:"",duration:""}), fd = _fd[0], setFd = _fd[1];
  var _pd = useState({question:"",options:["",""]}), pd = _pd[0], setPd = _pd[1];
  var _cd = useState({title:"",items:["",""]}), cd = _cd[0], setCd = _cd[1];

  var inp = { width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid "+T.glassBorder, background:T.glass, color:T.white, fontSize:12, outline:"none", marginBottom:7 };

  function submit() {
    if (selected==="flight") onShare("flight",{...fd, price:parseFloat(fd.price)||0, status:"found"});
    else if (selected==="poll") onShare("poll",{ question:pd.question, options:pd.options.filter(function(o){return o.trim()}).map(function(o,i){return {id:"o"+i,text:o,votes:[]}}), totalVotes:0 });
    else if (selected==="checklist") onShare("checklist",{ title:cd.title||"Checklist", items:cd.items.filter(function(i){return i.trim()}).map(function(i){return {text:i,done:false}}) });
    onClose();
  }

  return <div style={{ position:"fixed", inset:0, zIndex:100, animation:"fadeIn 0.2s" }}>
    <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)" }} />
    <div style={{ position:"absolute", bottom:0, left:0, right:0, maxWidth:480, margin:"0 auto",
      background:T.ink, borderRadius:"20px 20px 0 0", padding:"14px 16px 28px",
      animation:"slideSheet 0.3s cubic-bezier(0.34,1.56,0.64,1)", maxHeight:"75vh", overflow:"auto" }}>
      <div style={{ width:36, height:4, borderRadius:2, background:T.slate, margin:"0 auto 14px" }} />
      {!selected ? <>
        <h3 style={{ fontFamily:"'Fraunces',serif", fontSize:17, marginBottom:12 }}>Share to Chat</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          {SHARE_OPTIONS.map(function(opt){
            return <button key={opt.id} onClick={function(){setSelected(opt.id)}} style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:5, padding:"12px 6px",
              borderRadius:14, border:"1px solid "+T.glassBorder, background:T.glass, cursor:"pointer" }}>
              <div style={{ width:36, height:36, borderRadius:10, background:opt.color+"18",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{opt.icon}</div>
              <span style={{ fontSize:9, color:T.mist }}>{opt.label}</span>
            </button>;
          })}
        </div>
      </> : selected==="flight" ? <>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <button onClick={function(){setSelected(null)}} style={{ background:"none", border:"none", color:T.mist, fontSize:16, cursor:"pointer" }}>←</button>
          <h3 style={{ fontFamily:"'Fraunces',serif", fontSize:17 }}>✈️ Share Flight</h3>
        </div>
        <input style={inp} placeholder="Airline" value={fd.airline} onChange={function(e){setFd({...fd,airline:e.target.value})}} />
        <input style={inp} placeholder="Flight # (e.g. SQ 726)" value={fd.flight_number} onChange={function(e){setFd({...fd,flight_number:e.target.value})}} />
        <div style={{ display:"flex", gap:6 }}>
          <input style={{...inp,flex:1}} placeholder="From (CDG)" value={fd.from} onChange={function(e){setFd({...fd,from:e.target.value})}} />
          <input style={{...inp,flex:1}} placeholder="To (DPS)" value={fd.to} onChange={function(e){setFd({...fd,to:e.target.value})}} />
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <input style={{...inp,flex:1}} placeholder="Depart city" value={fd.fromCity} onChange={function(e){setFd({...fd,fromCity:e.target.value})}} />
          <input style={{...inp,flex:1}} placeholder="Arrive city" value={fd.toCity} onChange={function(e){setFd({...fd,toCity:e.target.value})}} />
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <input style={{...inp,flex:1}} placeholder="Date (Mar 15)" value={fd.date} onChange={function(e){setFd({...fd,date:e.target.value})}} />
          <input style={{...inp,flex:1}} placeholder="Price ($)" type="number" value={fd.price} onChange={function(e){setFd({...fd,price:e.target.value})}} />
        </div>
        <button onClick={submit} style={{ width:"100%", padding:"11px", borderRadius:12, border:"none",
          background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", color:T.white, fontSize:12, fontWeight:600, cursor:"pointer" }}>Share Flight ✈️</button>
      </> : selected==="poll" ? <>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <button onClick={function(){setSelected(null)}} style={{ background:"none", border:"none", color:T.mist, fontSize:16, cursor:"pointer" }}>←</button>
          <h3 style={{ fontFamily:"'Fraunces',serif", fontSize:17 }}>📊 Create Poll</h3>
        </div>
        <input style={inp} placeholder="Question..." value={pd.question} onChange={function(e){setPd({...pd,question:e.target.value})}} />
        {pd.options.map(function(o,i){ return <input key={i} style={inp} placeholder={"Option "+(i+1)} value={o} onChange={function(e){var opts=[...pd.options]; opts[i]=e.target.value; setPd({...pd,options:opts})}} />; })}
        <button onClick={function(){setPd({...pd,options:[...pd.options,""]})}} style={{ background:"none", border:"none", color:T.violet, fontSize:11, cursor:"pointer", marginBottom:6 }}>+ Add option</button>
        <button onClick={submit} style={{ width:"100%", padding:"11px", borderRadius:12, border:"none",
          background:"linear-gradient(135deg,"+T.violet+","+T.electric+")", color:T.white, fontSize:12, fontWeight:600, cursor:"pointer" }}>Share Poll 📊</button>
      </> : selected==="checklist" ? <>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <button onClick={function(){setSelected(null)}} style={{ background:"none", border:"none", color:T.mist, fontSize:16, cursor:"pointer" }}>←</button>
          <h3 style={{ fontFamily:"'Fraunces',serif", fontSize:17 }}>✅ Create Checklist</h3>
        </div>
        <input style={inp} placeholder="Title..." value={cd.title} onChange={function(e){setCd({...cd,title:e.target.value})}} />
        {cd.items.map(function(item,i){ return <input key={i} style={inp} placeholder={"Item "+(i+1)} value={item} onChange={function(e){var items=[...cd.items]; items[i]=e.target.value; setCd({...cd,items:items})}} />; })}
        <button onClick={function(){setCd({...cd,items:[...cd.items,""]})}} style={{ background:"none", border:"none", color:T.lime, fontSize:11, cursor:"pointer", marginBottom:6 }}>+ Add item</button>
        <button onClick={submit} style={{ width:"100%", padding:"11px", borderRadius:12, border:"none",
          background:"linear-gradient(135deg,"+T.mint+","+T.lime+")", color:T.midnight, fontSize:12, fontWeight:600, cursor:"pointer" }}>Share Checklist ✅</button>
      </> : <>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <button onClick={function(){setSelected(null)}} style={{ background:"none", border:"none", color:T.mist, fontSize:16, cursor:"pointer" }}>←</button>
          <h3 style={{ fontFamily:"'Fraunces',serif", fontSize:17 }}>Coming Soon</h3>
        </div>
        <p style={{ color:T.ash, fontSize:12 }}>This feature is coming in the next update!</p>
      </>}
    </div>
  </div>;
}

function ChatDetail({ match, onBack }) {
  var _msgs = useState([
    { id:1, from:"them", type:"text", text:"Heyy! So excited about "+match.destination+"! "+match.destEmoji, time:"2:30 PM" },
    { id:2, from:"me", type:"text", text:"Sameee! I've been looking at flights already ✈️", time:"2:31 PM" },
  ]), messages = _msgs[0], setMessages = _msgs[1];
  var _inp = useState(""), input = _inp[0], setInput = _inp[1];
  var _share = useState(false), showShare = _share[0], setShowShare = _share[1];
  var _typing = useState(false), typing = _typing[0], setTypingState = _typing[1];
  var scrollRef = useRef(null);

  useEffect(function() { scrollRef.current && scrollRef.current.scrollTo({ top:scrollRef.current.scrollHeight, behavior:"smooth" }); }, [messages, typing]);

  function send() {
    if (!input.trim()) return;
    setMessages(function(p){ return p.concat([{ id:Date.now(), from:"me", type:"text", text:input.trim(), time:"Now" }]); });
    setInput("");
    setTypingState(true);
    setTimeout(function() {
      setTypingState(false);
      setMessages(function(p){ return p.concat([{ id:Date.now()+1, from:"them", type:"text", text:REPLIES[Math.floor(Math.random()*REPLIES.length)], time:"Now" }]); });
    }, 1500+Math.random()*1500);
  }

  function handleShare(type, data) {
    setMessages(function(p){ return p.concat([{ id:Date.now(), from:"me", type:type, time:"Now", data:data }]); });
    setTypingState(true);
    var reactions = { flight:"Great find! ✈️", poll:"Voted! 📊", checklist:"Nice list! ✅", itinerary:"Love this! 📋", expense:"Looks good! 💰" };
    setTimeout(function() {
      setTypingState(false);
      setMessages(function(p){ return p.concat([{ id:Date.now()+1, from:"them", type:"text", text:reactions[type]||"Nice share! 🔥", time:"Now" }]); });
    }, 2000);
  }

  function handleVote(optId) {
    setMessages(function(prev){ return prev.map(function(m){
      if (m.type!=="poll") return m;
      return {...m, data:{...m.data, options:m.data.options.map(function(o){
        if (o.id!==optId) return {...o, votes:o.votes.filter(function(v){return v!=="me"})};
        return {...o, votes:o.votes.includes("me")?o.votes.filter(function(v){return v!=="me"}):[...o.votes,"me"]};
      })}};
    }); });
  }

  function renderMsg(msg) {
    var isMine = msg.from === "me";
    return <div key={msg.id} style={{ alignSelf:isMine?"flex-end":"flex-start", maxWidth:"82%",
      animation:(isMine?"slideInR":"slideInL")+" 0.3s ease both" }}>
      {!isMine && <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
        <div style={{ width:18, height:18, borderRadius:"50%", background:T.charcoal, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10 }}>{match.avatar}</div>
        <span style={{ fontSize:8, color:T.ash }}>{match.name}</span>
      </div>}
      <div style={{ marginLeft:isMine?0:23 }}>
        {msg.type==="text" ? <div style={{ padding:"9px 13px", borderRadius:16,
          background:isMine?"linear-gradient(135deg,"+T.flame+","+T.sunset+")":T.slate,
          borderBottomRightRadius:isMine?4:16, borderBottomLeftRadius:isMine?16:4 }}>
          <p style={{ fontSize:13, lineHeight:1.5 }}>{msg.text}</p>
        </div>
        : msg.type==="flight" ? <FlightCard data={msg.data} isMine={isMine} />
        : msg.type==="poll" ? <PollCard data={msg.data} onVote={handleVote} />
        : msg.type==="itinerary" ? <ItineraryCard data={msg.data} />
        : msg.type==="expense" ? <ExpenseCard data={msg.data} />
        : msg.type==="checklist" ? <ChecklistCard data={msg.data} />
        : null}
      </div>
      <span style={{ fontSize:8, color:T.ash, display:"block", marginTop:2, textAlign:isMine?"right":"left", paddingLeft:isMine?0:23 }}>{msg.time}</span>
    </div>;
  }

  return <div style={{ position:"fixed", inset:0, zIndex:50, background:T.midnight, display:"flex", flexDirection:"column", animation:"slideInR 0.25s ease" }}>
    {/* Header */}
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 14px 10px",
      borderBottom:"1px solid "+T.glass, background:"linear-gradient(to bottom,"+T.ink+","+T.midnight+")" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:T.white, fontSize:20, cursor:"pointer" }}>←</button>
      <div style={{ width:36, height:36, borderRadius:"50%", background:T.charcoal, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{match.avatar}</div>
      <div style={{ flex:1 }}><h3 style={{ fontSize:15, fontWeight:600 }}>{match.name}</h3><span style={{ fontSize:10, color:T.mint }}>● Online</span></div>
      <div style={{ background:"linear-gradient(135deg,"+T.flame+"33,"+T.sunset+"33)", borderRadius:10, padding:"4px 9px" }}>
        <span style={{ fontSize:10 }}>{match.destEmoji} {match.destination}</span>
      </div>
    </div>
    {/* Trip banner */}
    <div style={{ margin:"8px 14px", padding:"7px 11px", borderRadius:10, background:"linear-gradient(135deg,"+T.flame+"12,"+T.sunset+"08)",
      border:"1px solid "+T.flame+"25", display:"flex", alignItems:"center", gap:8 }}>
      <span>🗺️</span>
      <span style={{ fontSize:11, fontWeight:600 }}>Trip to {match.destination}</span>
      <span style={{ fontSize:10, color:T.ash }}>{match.dates}</span>
    </div>
    {/* Messages */}
    <div ref={scrollRef} style={{ flex:1, overflow:"auto", padding:"6px 14px", display:"flex", flexDirection:"column", gap:7 }}>
      {messages.map(renderMsg)}
      {typing && <div style={{ alignSelf:"flex-start", animation:"fadeIn 0.3s" }}>
        <div style={{ background:T.slate, borderRadius:16, borderBottomLeftRadius:4, padding:"9px 16px", display:"flex", gap:4, marginLeft:23 }}>
          {[0,1,2].map(function(i){ return <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:T.mist, animation:"typing 1.2s ease "+(i*0.2)+"s infinite" }} />; })}
        </div>
      </div>}
    </div>
    {/* Input */}
    <div style={{ padding:"9px 14px 13px", display:"flex", gap:8, alignItems:"center",
      borderTop:"1px solid "+T.glass, background:"linear-gradient(to top,"+T.ink+","+T.midnight+")" }}>
      <button onClick={function(){setShowShare(true)}} style={{
        width:38, height:38, borderRadius:"50%", border:"none", background:"linear-gradient(135deg,"+T.flame+"22,"+T.sunset+"22)",
        color:T.coral, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>+</button>
      <input value={input} onChange={function(e){setInput(e.target.value)}} onKeyDown={function(e){if(e.key==="Enter")send()}}
        placeholder="Type a message..." style={{ flex:1, padding:"10px 14px", borderRadius:20, background:T.glass,
        border:"1px solid "+T.glassBorder, color:T.white, fontSize:13, outline:"none" }} />
      <button onClick={send} style={{ width:38, height:38, borderRadius:"50%", border:"none",
        background:input.trim()?"linear-gradient(135deg,"+T.flame+","+T.sunset+")":T.slate,
        color:T.white, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>↑</button>
    </div>
    {showShare && <ShareSheet onClose={function(){setShowShare(false)}} onShare={handleShare} />}
  </div>;
}

// ══════════════════════════════════════════════════════════════
// TRIPS SCREEN
// ══════════════════════════════════════════════════════════════
function TripsScreen({ matches }) {
  var _trips = useState([
    { id:"t1", destination:"Bali", flag:"🇮🇩", dates:"Mar 15 – Apr 2", status:"planning", buddy:matches[0]||null,
      items:[{text:"Book flights",done:true},{text:"Reserve villa",done:true},{text:"Yoga retreat",done:false},{text:"Volcano trek",done:false}] },
  ]), trips = _trips[0], setTrips = _trips[1];
  var _exp = useState(null), expanded = _exp[0], setExpanded = _exp[1];
  var _newItem = useState(""), newItem = _newItem[0], setNewItem = _newItem[1];

  function addItem(tripId) {
    if (!newItem.trim()) return;
    setTrips(function(p){ return p.map(function(t){ return t.id===tripId ? {...t, items:t.items.concat([{text:newItem.trim(),done:false}])} : t; }); });
    setNewItem("");
  }
  function toggleItem(tripId, idx) {
    setTrips(function(p){ return p.map(function(t){
      return t.id===tripId ? {...t, items:t.items.map(function(item,i){ return i===idx?{...item,done:!item.done}:item; })} : t;
    }); });
  }

  if (expanded) {
    var trip = trips.find(function(t){return t.id===expanded});
    if (!trip) return null;
    var done = trip.items.filter(function(i){return i.done}).length;
    return <div style={{ flex:1, overflow:"auto", padding:"0 16px 16px", animation:"fadeIn 0.3s" }}>
      <button onClick={function(){setExpanded(null)}} style={{ background:"none", border:"none", color:T.mist, fontSize:13, cursor:"pointer", marginBottom:14, display:"flex", alignItems:"center", gap:5 }}>← Back</button>
      <Glass style={{ padding:18, marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
          <span style={{ fontSize:28 }}>{trip.flag}</span>
          <div><h2 style={{ fontFamily:"'Fraunces',serif", fontSize:22 }}>{trip.destination}</h2><p style={{ color:T.ash, fontSize:11 }}>{trip.dates}</p></div>
          <span style={{ marginLeft:"auto", padding:"3px 10px", borderRadius:8, fontSize:10, fontWeight:600, background:T.mint+"22", color:T.mint, textTransform:"capitalize" }}>{trip.status}</span>
        </div>
        <div style={{ height:5, borderRadius:3, background:T.slate, marginTop:10 }}>
          <div style={{ height:"100%", borderRadius:3, width:(done/trip.items.length*100)+"%", background:"linear-gradient(90deg,"+T.mint+","+T.lime+")", transition:"width 0.4s" }} />
        </div>
        <div style={{ fontSize:10, color:T.ash, marginTop:4 }}>{done}/{trip.items.length} completed</div>
      </Glass>
      <h3 style={{ fontSize:11, color:T.ash, textTransform:"uppercase", letterSpacing:2, marginBottom:10 }}>Checklist</h3>
      {trip.items.map(function(item, idx){
        return <div key={idx} onClick={function(){toggleItem(trip.id,idx)}} style={{
          display:"flex", alignItems:"center", gap:11, padding:"11px 14px", marginBottom:6,
          background:T.glass, border:"1px solid "+T.glassBorder, borderRadius:12, cursor:"pointer", opacity:item.done?0.5:1 }}>
          <div style={{ width:20, height:20, borderRadius:6, border:item.done?"none":"2px solid "+T.ash,
            background:item.done?"linear-gradient(135deg,"+T.mint+","+T.lime+")":"none",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:11 }}>{item.done?"✓":""}</div>
          <span style={{ fontSize:13, textDecoration:item.done?"line-through":"none", color:item.done?T.ash:T.white }}>{item.text}</span>
        </div>;
      })}
      <div style={{ display:"flex", gap:8, marginTop:10 }}>
        <input value={newItem} onChange={function(e){setNewItem(e.target.value)}} onKeyDown={function(e){if(e.key==="Enter")addItem(trip.id)}}
          placeholder="Add a task..." style={{ flex:1, padding:"11px 14px", borderRadius:12, background:T.glass, border:"1px solid "+T.glassBorder, color:T.white, fontSize:13, outline:"none" }} />
        <button onClick={function(){addItem(trip.id)}} style={{ padding:"11px 18px", borderRadius:12, border:"none",
          background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", color:T.white, fontWeight:600, cursor:"pointer", fontSize:12 }}>Add</button>
      </div>
    </div>;
  }

  return <div style={{ flex:1, overflow:"auto", padding:"0 16px 16px" }}>
    {trips.length === 0 ? <div style={{ textAlign:"center", padding:40 }}>
      <div style={{ fontSize:44, marginBottom:10 }}>🗺️</div>
      <h3 style={{ fontFamily:"'Fraunces',serif" }}>No trips yet</h3>
      <p style={{ color:T.ash, fontSize:12 }}>Match with travelers to start planning!</p>
    </div> : trips.map(function(trip, i) {
      return <Glass key={trip.id} onClick={function(){setExpanded(trip.id)}} style={{
        padding:16, marginBottom:10, cursor:"pointer", animation:"fadeInUp 0.3s ease "+(i*0.06)+"s both" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"start", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:24 }}>{trip.flag}</span>
            <div><h3 style={{ fontFamily:"'Fraunces',serif", fontSize:17 }}>{trip.destination}</h3><p style={{ color:T.ash, fontSize:11 }}>{trip.dates}</p></div>
          </div>
          <span style={{ padding:"3px 9px", borderRadius:8, fontSize:10, fontWeight:600, background:T.mint+"22", color:T.mint }}>{trip.status}</span>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          {trip.buddy && <div style={{ width:28, height:28, borderRadius:"50%", background:T.charcoal, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>{trip.buddy.avatar}</div>}
          <span style={{ color:T.ash, fontSize:11 }}>{trip.items.length} tasks</span>
        </div>
      </Glass>;
    })}
  </div>;
}

// ══════════════════════════════════════════════════════════════
// PROFILE SCREEN
// ══════════════════════════════════════════════════════════════
function ProfileScreen({ matchCount, onSignOut }) {
  return <div style={{ flex:1, overflow:"auto", padding:"0 16px 16px" }}>
    <Glass style={{ padding:22, textAlign:"center", marginBottom:18, animation:"fadeInUp 0.4s ease" }}>
      <div style={{ width:72, height:72, borderRadius:"50%", margin:"0 auto 10px", background:T.charcoal, border:"3px solid "+T.flame,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>{user.avatar}</div>
      <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:20 }}>{user.name}</h2>
      <p style={{ color:T.ash, fontSize:12 }}>explorer@baddie.app</p>
      <div style={{ display:"flex", justifyContent:"center", gap:24, marginTop:16 }}>
        {[{icon:"🔥",label:"Matches",value:matchCount},{icon:"✈️",label:"Trips",value:1},{icon:"🌍",label:"Countries",value:4}].map(function(s){
          return <div key={s.label} style={{ textAlign:"center" }}>
            <div style={{ fontSize:18, marginBottom:3 }}>{s.icon}</div>
            <div style={{ fontSize:18, fontWeight:700 }}>{s.value}</div>
            <div style={{ fontSize:10, color:T.ash }}>{s.label}</div>
          </div>;
        })}
      </div>
    </Glass>
    {["👤 Edit Profile","🎯 Travel Preferences","🔔 Notifications","🔒 Privacy","🎨 Appearance","❓ Help"].map(function(item,i){
      return <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 14px", borderRadius:12, cursor:"pointer" }}>
        <span style={{ fontSize:16 }}>{item.split(" ")[0]}</span>
        <span style={{ fontSize:13, fontWeight:500 }}>{item.substring(item.indexOf(" ")+1)}</span>
        <span style={{ marginLeft:"auto", color:T.ash }}>›</span>
      </div>;
    })}
    <button onClick={onSignOut} style={{ width:"100%", marginTop:16, padding:13, borderRadius:14, border:"1px solid "+T.rose+"33", background:T.rose+"11", color:T.rose, fontSize:13, fontWeight:500, cursor:"pointer" }}>Sign Out</button>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// MAIN APP — ties everything together
// ══════════════════════════════════════════════════════════════
export default function App() {
  var _auth = useState(false), authed = _auth[0], setAuthed = _auth[1];
  var _user = useState(null), userData = _user[0], setUserData = _user[1];
  var _screen = useState("discover"), screen = _screen[0], setScreen = _screen[1];
  var _matches = useState([TRAVELERS[0], TRAVELERS[2]]), matches = _matches[0], setMatches = _matches[1];
  var _showMatch = useState(null), showMatch = _showMatch[0], setShowMatch = _showMatch[1];
  var _activeChat = useState(null), activeChat = _activeChat[0], setActiveChat = _activeChat[1];

  function handleLogin(data) { setUserData(data); setAuthed(true); }
  function handleMatch(traveler) {
    if (!matches.find(function(m){return m.id===traveler.id})) setMatches(function(p){return p.concat([traveler])});
    setShowMatch(traveler);
  }

  if (!authed) return <><style>{css}</style><AuthScreen onLogin={handleLogin} /></>;

  var tabs = [
    { id:"discover", icon:"🔥", label:"Discover" },
    { id:"chats", icon:"💬", label:"Chats" },
    { id:"trips", icon:"✈️", label:"Trips" },
    { id:"profile", icon:"👤", label:"Profile" },
  ];

  return <>
    <style>{css}</style>
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto",
      background:"radial-gradient(ellipse at 20% 0%, "+T.flame+"08 0%, transparent 40%), "+T.midnight }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px 10px" }}>
        <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900,
          background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>baddie</h1>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {matches.length>0 && <div style={{ background:T.flame+"22", borderRadius:12, padding:"3px 9px", display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ fontSize:11 }}>🔥</span><span style={{ fontSize:11, color:T.coral, fontWeight:600 }}>{matches.length}</span>
          </div>}
          <div style={{ width:32, height:32, borderRadius:"50%", background:T.charcoal, border:"2px solid "+T.slate,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, cursor:"pointer" }}
            onClick={function(){setScreen("profile")}}>{user.avatar}</div>
        </div>
      </div>

      {/* Screen content */}
      {screen==="discover" && <DiscoverScreen onMatch={handleMatch} matches={matches} />}
      {screen==="chats" && <ChatsListScreen matches={matches} onOpenChat={setActiveChat} />}
      {screen==="trips" && <TripsScreen matches={matches} />}
      {screen==="profile" && <ProfileScreen matchCount={matches.length} onSignOut={function(){setAuthed(false)}} />}

      {/* Nav bar */}
      <div style={{ display:"flex", borderTop:"1px solid "+T.glass, background:"linear-gradient(to top,"+T.ink+","+T.midnight+")", padding:"7px 8px 10px" }}>
        {tabs.map(function(tab){
          return <button key={tab.id} onClick={function(){setScreen(tab.id)}} style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2,
            background:"none", border:"none", cursor:"pointer", color:screen===tab.id?T.flame:T.ash }}>
            <span style={{ fontSize:18, transform:screen===tab.id?"scale(1.12)":"scale(1)", transition:"transform 0.2s" }}>{tab.icon}</span>
            <span style={{ fontSize:9, fontWeight:screen===tab.id?600:400 }}>{tab.label}</span>
            {screen===tab.id && <div style={{ width:4, height:4, borderRadius:"50%", background:T.flame, marginTop:-1 }} />}
          </button>;
        })}
      </div>

      {/* Overlays */}
      {showMatch && <MatchOverlay match={showMatch} onMessage={function(){ setShowMatch(null); setActiveChat(showMatch); setScreen("chats"); }} onClose={function(){setShowMatch(null)}} />}
      {activeChat && <ChatDetail match={activeChat} onBack={function(){setActiveChat(null)}} />}
    </div>
  </>;
}
