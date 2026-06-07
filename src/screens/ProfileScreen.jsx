import { useState } from "react";
import { T } from "../theme";
import Glass from "../ui/Glass";
import VerifiedBadge from "../ui/VerifiedBadge";
import EditProfileScreen from "./EditProfileScreen";
import ProfileMediaSection from "../components/PhotoVerification";
import { PlanBadge, PremiumPaywall } from "../components/PremiumFeatures";
import { NotificationsScreen, PrivacyScreen, AppearanceScreen, HelpScreen } from "./SettingsScreens";
import { useTrips } from "../hooks/useSupabase";
import { isDemo } from "../lib/supabase";

export default function ProfileScreen({ matchCount, userId, userProfile, onSignOut, onProfileUpdate }) {
  var [editMode, setEditMode] = useState(false);
  var [showMedia, setShowMedia] = useState(false);
  var [sub, setSub] = useState(null);          // "notifications" | "privacy" | "appearance" | "help"
  var [showPaywall, setShowPaywall] = useState(false);
  var [localProfile, setLocalProfile] = useState(userProfile);
  var tripsHook = useTrips(isDemo ? null : userId);
  var trips = tripsHook.trips || [];
  var tripCount = isDemo ? (localProfile?.trip_count || 0) : trips.length;
  var placeCount = isDemo
    ? 4
    : new Set(trips.map(function(t){ return (t.destination || "").trim().toLowerCase(); }).filter(Boolean)).size;

  var displayName = localProfile?.name || "You";
  var displayAvatar = localProfile?.avatar || "😎";
  var displayEmail = localProfile?.email || userProfile?.email || "explorer@baddie.app";
  var displayBio = localProfile?.bio || "";
  var displayCity = localProfile?.city || "";
  var displayDest = localProfile?.destination || "";
  var displayVibe = localProfile?.vibe || "";

  function handleSave(updated) {
    if (updated) {
      setLocalProfile(function(prev){ return {...prev, ...updated}; });
      if (onProfileUpdate) onProfileUpdate(updated);
    }
  }

  if (editMode) {
    return <EditProfileScreen
      userProfile={localProfile}
      onSave={handleSave}
      onBack={function(updated){ if(updated) handleSave(updated); setEditMode(false); }}
    />;
  }

  if (showMedia) {
    return <div style={{ flex:1, overflow:"auto", padding:"0 16px 16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 0" }}>
        <button onClick={function(){ setShowMedia(false); }} style={{ background:"none", border:"none", color:T.coral, fontSize:20, cursor:"pointer" }}>‹</button>
        <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:18 }}>Photos & Verification</h2>
      </div>
      <ProfileMediaSection
        userId={userId}
        photos={localProfile?.photos || []}
        verifyStatus={localProfile?.verified ? "verified" : (localProfile?.verify_status || "unverified")}
        onPhotosUpdate={function(photos){ handleSave({ photos: photos }); }}
        onVerifyComplete={function(status){ handleSave({ verify_status: status }); }}
      />
    </div>;
  }

  if (sub === "notifications") return <NotificationsScreen userId={userId} profile={localProfile} onBack={function(){ setSub(null); }} />;
  if (sub === "privacy") return <PrivacyScreen userId={userId} onBack={function(){ setSub(null); }} />;
  if (sub === "appearance") return <AppearanceScreen userId={userId} onBack={function(){ setSub(null); }} />;
  if (sub === "help") return <HelpScreen onBack={function(){ setSub(null); }} />;

  return <div style={{ flex:1, overflow:"auto", padding:"0 16px 16px" }}>
    <Glass style={{ padding:22, textAlign:"center", marginBottom:18, animation:"fadeInUp 0.4s ease" }}>
      <div style={{ width:72, height:72, borderRadius:"50%", margin:"0 auto 10px", background:T.charcoal, border:"3px solid "+T.flame,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>{displayAvatar}</div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, flexWrap:"wrap" }}>
        <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:20 }}>{displayName}</h2>
        {localProfile?.verified && <VerifiedBadge size={16} />}
        <PlanBadge plan={localProfile?.plan} />
      </div>
      {!localProfile?.verified && <p style={{ color:T.sky, fontSize:11, marginTop:4 }}>🛡️ Verify your identity to build trust</p>}
      {displayCity && <p style={{ color:T.coral, fontSize:11, marginTop:2 }}>📍 {displayCity}</p>}
      <p style={{ color:T.ash, fontSize:12, marginTop:2 }}>{displayEmail}</p>
      {displayBio && <p style={{ color:T.mist, fontSize:11, marginTop:8, lineHeight:1.5, fontStyle:"italic" }}>"{displayBio}"</p>}
      {displayDest && <div style={{ display:"inline-flex", alignItems:"center", gap:5, marginTop:10,
        background:T.flame+"22", borderRadius:12, padding:"4px 12px" }}>
        <span style={{ fontSize:11, color:T.coral }}>✈️ Heading to {displayDest}</span>
      </div>}
      {displayVibe && <div style={{ display:"inline-flex", alignItems:"center", gap:5, marginTop:6, marginLeft:6,
        background:T.electric+"18", borderRadius:12, padding:"4px 12px" }}>
        <span style={{ fontSize:11, color:T.violet }}>{displayVibe}</span>
      </div>}
      {isDemo && <p style={{ color:T.gold, fontSize:10, marginTop:6, background:T.gold+"15", padding:"3px 8px", borderRadius:6, display:"inline-block" }}>Demo Mode</p>}
      <div style={{ display:"flex", justifyContent:"center", gap:24, marginTop:16 }}>
        {[{icon:"🔥",label:"Matches",value:matchCount},{icon:"✈️",label:"Trips",value:tripCount},{icon:"🌍",label:"Places",value:placeCount}].map(function(s){
          return <div key={s.label} style={{ textAlign:"center" }}>
            <div style={{ fontSize:18, marginBottom:3 }}>{s.icon}</div>
            <div style={{ fontSize:18, fontWeight:700 }}>{s.value}</div>
            <div style={{ fontSize:10, color:T.ash }}>{s.label}</div>
          </div>;
        })}
      </div>
    </Glass>

    {/* Go Premium banner (hidden once on a paid plan) */}
    {(!localProfile?.plan || localProfile.plan === "free") &&
      <div onClick={function(){ setShowPaywall(true); }} style={{ display:"flex", alignItems:"center", gap:12,
        padding:"14px", borderRadius:16, marginBottom:8, cursor:"pointer",
        background:"linear-gradient(135deg,"+T.flame+"22,"+T.gold+"22)", border:"1px solid "+T.gold+"44" }}>
        <span style={{ fontSize:22 }}>✨</span>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:14, fontWeight:700 }}>Go Premium</p>
          <p style={{ fontSize:10, color:T.mist, marginTop:2 }}>Unlimited swipes, see who likes you & more</p>
        </div>
        <span style={{ color:T.gold, fontWeight:700 }}>›</span>
      </div>}

    {/* Menu items */}
    {[
      { icon:"👤", label:"Edit Profile", action: function(){ setEditMode(true); } },
      { icon:"🛡️", label: localProfile?.verified ? "Photos & Verification ✓" : "Photos & Verification", action: function(){ setShowMedia(true); } },
      { icon:"🎯", label:"Travel Preferences", action: function(){ setEditMode(true); } },
      { icon:"🔔", label:"Notifications", action: function(){ setSub("notifications"); } },
      { icon:"🔒", label:"Privacy", action: function(){ setSub("privacy"); } },
      { icon:"🎨", label:"Appearance", action: function(){ setSub("appearance"); } },
      { icon:"❓", label:"Help", action: function(){ setSub("help"); } },
    ].map(function(item, i){
      return <div key={i} onClick={item.action || undefined} style={{
        display:"flex", alignItems:"center", gap:12, padding:"13px 14px", borderRadius:12, cursor: item.action ? "pointer" : "default",
        background: item.action ? "transparent" : "transparent",
        transition:"background 0.15s" }}>
        <span style={{ fontSize:16 }}>{item.icon}</span>
        <span style={{ fontSize:13, fontWeight:500, color: item.action ? T.white : T.ash }}>{item.label}</span>
        <span style={{ marginLeft:"auto", color: item.action ? T.coral : T.slate }}>›</span>
      </div>;
    })}

    <button onClick={onSignOut} style={{ width:"100%", marginTop:16, padding:13, borderRadius:14, border:"1px solid "+T.rose+"33", background:T.rose+"11", color:T.rose, fontSize:13, fontWeight:500, cursor:"pointer" }}>Sign Out</button>

    {showPaywall && <PremiumPaywall
      currentPlan={localProfile?.plan || "free"}
      userId={userId}
      onUpgrade={function(plan){ handleSave({ plan: plan }); setShowPaywall(false); }}
      onClose={function(){ setShowPaywall(false); }}
    />}
  </div>;
}
