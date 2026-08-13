import { useState } from "react";
import { useAuth, useProfile, useMatches } from "./hooks/useSupabase";
import { isDemo } from "./lib/supabase";
import { T, css } from "./theme";
import { TRAVELERS } from "./data/mock";
import AdminDashboard from "./components/AdminDashboard";
import AuthScreen from "./screens/AuthScreen";
import DiscoverScreen from "./screens/DiscoverScreen";
import ChatsListScreen from "./screens/ChatsListScreen";
import TripsScreen from "./screens/TripsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import MatchOverlay from "./screens/MatchOverlay";
import ChatDetail from "./screens/ChatDetail";
import NotificationCenter from "./ui/NotificationCenter";
import VerifyScreen from "./screens/VerifyScreen";
import LegalScreen from "./screens/LegalScreen";

// ══════════════════════════════════════════════════════════════
// BADDIE — Fully Integrated Travel App
// Auth → Discover → Match → Chat (with sharing) → Trip Planner
// ══════════════════════════════════════════════════════════════

export default function App() {
  if (typeof window !== "undefined" && window.location.pathname === "/admin") { return <AdminDashboard />; }
  if (typeof window !== "undefined" && window.location.pathname === "/verify") { return <VerifyScreen />; }
  if (typeof window !== "undefined" && window.location.pathname === "/privacy") { return <><style>{css}</style><LegalScreen page="privacy" /></>; }
  if (typeof window !== "undefined" && window.location.pathname === "/terms") { return <><style>{css}</style><LegalScreen page="terms" /></>; }
  var auth = useAuth();
  var [screen, setScreen] = useState("discover");
  var [demoMatches, setDemoMatches] = useState([TRAVELERS[0], TRAVELERS[2]]);
  var [showMatch, setShowMatch] = useState(null);
  var [activeChat, setActiveChat] = useState(null);
  var [manualAuth, setManualAuth] = useState(false);

  var userId = auth.user?.id || null;
  var profileHook = useProfile(isDemo ? null : userId);
  var matchesHook = useMatches(isDemo ? null : userId);

  var userProfile = isDemo
    ? { name:"You", avatar:"😎", vibe:"Adventurous", budget:"Mid-range", interests:["Hiking","Food","Photography"] }
    : (profileHook.profile || { name: auth.user?.user_metadata?.name || "Traveler", avatar:"😎", email: auth.user?.email || "" });

  var matches = isDemo ? demoMatches : (matchesHook.matches || []);
  var isAuthed = isDemo ? manualAuth : !!auth.user;
  var isLoading = isDemo ? false : auth.loading;

  function handleLogin(data) {
    if (isDemo) setManualAuth(true);
  }

  function handleMatch(traveler) {
    if (isDemo) {
      if (!demoMatches.find(function(m){return m.id===traveler.id})) setDemoMatches(function(p){return p.concat([traveler])});
    }
    setShowMatch(traveler);
  }

  async function handleSignOut() {
    if (isDemo) { setManualAuth(false); return; }
    await auth.signOut();
  }

  if (isLoading) return <>
    <style>{css}</style>
    <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:T.midnight }}>
      <div style={{ textAlign:"center", animation:"fadeIn 0.5s" }}>
        <div style={{ fontSize:48, animation:"float 2s ease-in-out infinite" }}>✈️</div>
        <p style={{ color:T.mist, marginTop:12 }}>Loading...</p>
      </div>
    </div>
  </>;

  if (!isAuthed) return <><style>{css}</style><AuthScreen onLogin={handleLogin} /></>;

  var userAvatar = userProfile?.avatar || "😎";

  var tabs = [
    { id:"discover", icon:"🔥", label:"Discover" },
    { id:"chats", icon:"💬", label:"Chats" },
    { id:"trips", icon:"✈️", label:"Trips" },
    { id:"profile", icon:"👤", label:"Profile" },
  ];

  var brand = <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900,
    background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", margin:0 }}>baddie</h1>;

  return <>
    <style>{css}</style>
    <div className="app-frame" style={{ background:"radial-gradient(ellipse at 20% 0%, "+T.flame+"08 0%, transparent 40%), "+T.midnight }}>

      {/* Desktop sidebar nav (hidden on phones) */}
      <aside className="app-sidebar">
        <div style={{ padding:"6px 10px 22px" }}>{brand}</div>
        <nav style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {tabs.map(function(tab){
            var active = screen===tab.id;
            return <button key={tab.id} onClick={function(){setScreen(tab.id)}} style={{
              display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:14, cursor:"pointer",
              border:"none", textAlign:"left", background: active ? "linear-gradient(135deg,"+T.flame+"22,"+T.sunset+"14)" : "transparent",
              color: active ? T.white : T.ash, fontSize:14, fontWeight: active?700:500 }}>
              <span style={{ fontSize:19 }}>{tab.icon}</span>{tab.label}
              {tab.id==="discover" && matches.length>0 && <span style={{ marginLeft:"auto", background:T.flame+"22", color:T.coral, borderRadius:10, padding:"1px 8px", fontSize:11, fontWeight:700 }}>{matches.length}</span>}
            </button>;
          })}
        </nav>
        <div style={{ flex:1 }} />
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 8px", borderTop:"1px solid "+T.glass }}>
          <div onClick={function(){setScreen("profile")}} style={{ width:38, height:38, borderRadius:"50%", background:T.charcoal, border:"2px solid "+T.slate,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, cursor:"pointer", flexShrink:0 }}>{userAvatar}</div>
          <div onClick={function(){setScreen("profile")}} style={{ flex:1, minWidth:0, cursor:"pointer" }}>
            <p style={{ fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{userProfile?.name || "You"}</p>
            <p style={{ fontSize:10, color:T.ash }}>View profile</p>
          </div>
          <NotificationCenter userId={userId} onNavigateTrips={function(){ setScreen("trips"); }} />
        </div>
      </aside>

      {/* Content column */}
      <div className="app-column" style={{ display:"flex", flexDirection:"column", minWidth:0 }}>
        {/* Mobile top bar (hidden on desktop) */}
        <div className="app-topbar" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px 10px" }}>
          {brand}
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {matches.length>0 && <div style={{ background:T.flame+"22", borderRadius:12, padding:"3px 9px", display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:11 }}>🔥</span><span style={{ fontSize:11, color:T.coral, fontWeight:600 }}>{matches.length}</span>
            </div>}
            <NotificationCenter userId={userId} onNavigateTrips={function(){ setScreen("trips"); }} />
            <div style={{ width:32, height:32, borderRadius:"50%", background:T.charcoal, border:"2px solid "+T.slate,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, cursor:"pointer" }}
              onClick={function(){setScreen("profile")}}>{userAvatar}</div>
          </div>
        </div>

        {screen==="discover" && <DiscoverScreen onMatch={handleMatch} matches={matches} userId={userId} userProfile={userProfile} />}
        {screen==="chats" && <ChatsListScreen matches={matches} userId={userId} onOpenChat={setActiveChat} />}
        {screen==="trips" && <TripsScreen matches={matches} userId={userId} />}
        {screen==="profile" && <ProfileScreen matchCount={matches.length} userId={userId} userProfile={userProfile} onSignOut={handleSignOut} onProfileUpdate={function(updated){ /* future: sync to Supabase */ }} />}

        {/* Mobile bottom nav (hidden on desktop) */}
        <div className="app-bottomnav" style={{ display:"flex", borderTop:"1px solid "+T.glass, background:"linear-gradient(to top,"+T.ink+","+T.midnight+")", padding:"7px 8px 10px" }}>
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
      </div>

      {showMatch && <MatchOverlay match={showMatch} userAvatar={userAvatar} onMessage={function(){ setShowMatch(null); setActiveChat(showMatch); setScreen("chats"); }} onClose={function(){setShowMatch(null)}} />}
      {activeChat && <ChatDetail match={activeChat} userId={userId} onBack={function(){setActiveChat(null)}} />}
    </div>
  </>;
}
