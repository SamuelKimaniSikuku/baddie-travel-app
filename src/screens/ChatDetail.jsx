import { useState, useEffect, useRef } from "react";
import { T } from "../theme";
import { useChat, useTrips } from "../hooks/useSupabase";
import { isDemo } from "../lib/supabase";
import { REPLIES } from "../data/mock";
import { profilesService } from "../services/profiles";
import { tripsService } from "../services/trips";
import VerifiedBadge from "../ui/VerifiedBadge";
import { ShareSheet, FlightCard, PollCard, ItineraryCard, ExpenseCard, ChecklistCard } from "./ShareCards";

export default function ChatDetail({ match, userId, onBack }) {
  var conversationId = isDemo ? null : (match.id || match.conversation_id);
  var chatHook = useChat(conversationId, userId);
  var [demoMessages, setDemoMessages] = useState([
    { id:1, from:"them", type:"text", text:"Heyy! So excited about "+(match.destination||match.shared_destination||"our trip")+"! "+(match.destEmoji||match.destination_emoji||"🌍"), time:"2:30 PM" },
    { id:2, from:"me", type:"text", text:"Sameee! I've been looking at flights already ✈️", time:"2:31 PM" },
  ]);
  var [input, setInput] = useState("");
  var [showShare, setShowShare] = useState(false);
  var [safetyOpen, setSafetyOpen] = useState(false);
  var [safetyDone, setSafetyDone] = useState("");
  var tripsHook = useTrips(isDemo ? null : userId);
  var [saveFlight, setSaveFlight] = useState(null); // flight data pending "save to trip"
  var [saveMsg, setSaveMsg] = useState("");
  var [savingTo, setSavingTo] = useState("");

  var otherUserId = match.id;
  if (!isDemo && match.match) {
    var ou = match.match.user1?.id === userId ? match.match.user2 : match.match.user1;
    otherUserId = ou?.id;
  }
  var otherVerified = match.verified || (match.match && (match.match.user1?.id === userId ? match.match.user2 : match.match.user1)?.verified);

  async function reportUser() {
    if (!isDemo && otherUserId) await profilesService.reportUser(userId, otherUserId, "inappropriate", "Reported from chat");
    setSafetyDone("Report sent. Our team will review it.");
    setSafetyOpen(false);
  }
  async function blockUser() {
    if (!isDemo && otherUserId) await profilesService.blockUser(userId, otherUserId);
    setSafetyDone("User blocked. They can no longer reach you.");
    setSafetyOpen(false);
    setTimeout(function(){ onBack(); }, 1200);
  }
  var [typing, setTypingState] = useState(false);
  var scrollRef = useRef(null);

  var messages = isDemo ? demoMessages : chatHook.messages;
  var isTyping = isDemo ? typing : chatHook.typingUsers.length > 0;

  useEffect(function() { scrollRef.current && scrollRef.current.scrollTo({ top:scrollRef.current.scrollHeight, behavior:"smooth" }); }, [messages, isTyping]);

  async function send() {
    if (!input.trim()) return;
    if (isDemo) {
      setDemoMessages(function(p){ return p.concat([{ id:Date.now(), from:"me", type:"text", text:input.trim(), time:"Now" }]); });
      setInput("");
      setTypingState(true);
      setTimeout(function() {
        setTypingState(false);
        setDemoMessages(function(p){ return p.concat([{ id:Date.now()+1, from:"them", type:"text", text:REPLIES[Math.floor(Math.random()*REPLIES.length)], time:"Now" }]); });
      }, 1500+Math.random()*1500);
    } else {
      await chatHook.sendMessage(input.trim());
      setInput("");
    }
  }

  function handleShare(type, data) {
    if (isDemo) {
      setDemoMessages(function(p){ return p.concat([{ id:Date.now(), from:"me", type:type, time:"Now", data:data }]); });
      setTypingState(true);
      var reactions = { flight:"Great find! ✈️", poll:"Voted! 📊", checklist:"Nice list! ✅", itinerary:"Love this! 📋", expense:"Looks good! 💰" };
      setTimeout(function() {
        setTypingState(false);
        setDemoMessages(function(p){ return p.concat([{ id:Date.now()+1, from:"them", type:"text", text:reactions[type]||"Nice share! 🔥", time:"Now" }]); });
      }, 2000);
    } else {
      chatHook.sendMessage(JSON.stringify(data), type, data);
    }
  }

  async function saveFlightToTrip(trip) {
    setSavingTo(trip.id);
    if (!isDemo && trip.id !== "demo-trip") {
      await tripsService.addFlight(trip.id, saveFlight, userId);
    }
    setSavingTo("");
    setSaveFlight(null);
    setSaveMsg("Flight saved to " + trip.destination + " ✈️");
    setTimeout(function(){ setSaveMsg(""); }, 2600);
  }

  // Trips offered in the picker. In demo (or when the user has no trips yet)
  // fall back to a single option based on this conversation's destination.
  function pickerTrips() {
    var live = tripsHook.trips || [];
    if (!isDemo && live.length) return live;
    return [{ id:"demo-trip", destination: matchDest || "This trip", destination_emoji: matchDestEmoji }];
  }

  function handleVote(optId) {
    setDemoMessages(function(prev){ return prev.map(function(m){
      if (m.type!=="poll") return m;
      return {...m, data:{...m.data, options:m.data.options.map(function(o){
        if (o.id!==optId) return {...o, votes:(o.votes||[]).filter(function(v){return v!=="me"})};
        return {...o, votes:(o.votes||[]).includes("me")?(o.votes||[]).filter(function(v){return v!=="me"}):[...(o.votes||[]),"me"]};
      })}};
    }); });
  }

  function renderMsg(msg) {
    var isMine = isDemo ? msg.from === "me" : msg.sender_id === userId;
    var msgContent = msg.text || msg.content || "";
    var msgType = msg.type || "text";
    var msgData = msg.data || msg.metadata || {};
    var msgTime = msg.time || (msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "");

    return <div key={msg.id} style={{ alignSelf:isMine?"flex-end":"flex-start", maxWidth:"82%",
      animation:(isMine?"slideInR":"slideInL")+" 0.3s ease both" }}>
      {!isMine && <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
        <div style={{ width:18, height:18, borderRadius:"50%", background:T.charcoal, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10 }}>{match.avatar || "😎"}</div>
        <span style={{ fontSize:8, color:T.ash }}>{match.name || msg.sender?.name || ""}</span>
      </div>}
      <div style={{ marginLeft:isMine?0:23 }}>
        {msgType==="text" ? <div style={{ padding:"9px 13px", borderRadius:16,
          background:isMine?"linear-gradient(135deg,"+T.flame+","+T.sunset+")":T.slate,
          borderBottomRightRadius:isMine?4:16, borderBottomLeftRadius:isMine?16:4 }}>
          <p style={{ fontSize:13, lineHeight:1.5 }}>{msgContent}</p>
        </div>
        : msgType==="flight" ? <FlightCard data={msgData} isMine={isMine} onSave={function(f){ setSaveFlight(f); }} />
        : msgType==="poll" ? <PollCard data={msgData} onVote={handleVote} />
        : msgType==="itinerary" ? <ItineraryCard data={msgData} />
        : msgType==="expense" ? <ExpenseCard data={msgData} />
        : msgType==="checklist" ? <ChecklistCard data={msgData} />
        : <div style={{ padding:"9px 13px", borderRadius:16, background:T.slate }}>
            <p style={{ fontSize:13, lineHeight:1.5 }}>{msgContent}</p>
          </div>}
      </div>
      <span style={{ fontSize:8, color:T.ash, display:"block", marginTop:2, textAlign:isMine?"right":"left", paddingLeft:isMine?0:23 }}>{msgTime}</span>
    </div>;
  }

  var matchName = match.name || "Chat";
  var matchAvatar = match.avatar || "😎";
  var matchDest = match.destination || match.shared_destination || "";
  var matchDestEmoji = match.destEmoji || match.destination_emoji || "🌍";
  var matchDates = match.dates || match.date_display || "";

  return <div className="app-overlay" style={{ zIndex:50, background:T.midnight }}>
   <div className="app-panel" style={{ background:T.midnight, animation:"slideInR 0.25s ease" }}>
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 14px 10px",
      borderBottom:"1px solid "+T.glass, background:"linear-gradient(to bottom,"+T.ink+","+T.midnight+")" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:T.white, fontSize:20, cursor:"pointer" }}>←</button>
      <div style={{ width:36, height:36, borderRadius:"50%", background:T.charcoal, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{matchAvatar}</div>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <h3 style={{ fontSize:15, fontWeight:600 }}>{matchName}</h3>
          {otherVerified && <VerifiedBadge size={14} />}
        </div>
        <span style={{ fontSize:10, color:T.mint }}>● Online</span>
      </div>
      <div style={{ background:"linear-gradient(135deg,"+T.flame+"33,"+T.sunset+"33)", borderRadius:10, padding:"4px 9px" }}>
        <span style={{ fontSize:10 }}>{matchDestEmoji} {matchDest}</span>
      </div>
      <button onClick={function(){ setSafetyOpen(true); }} aria-label="Safety options" style={{ background:"none", border:"none", color:T.mist, fontSize:20, cursor:"pointer", padding:"0 4px" }}>⋯</button>
    </div>
    {safetyDone && <div style={{ margin:"8px 14px 0", padding:"8px 11px", borderRadius:10, background:T.mint+"18", border:"1px solid "+T.mint+"33", fontSize:11, color:T.mint }}>{safetyDone}</div>}
    {safetyOpen && <div onClick={function(){ setSafetyOpen(false); }} style={{ position:"fixed", inset:0, zIndex:60, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"flex-end" }}>
      <div onClick={function(e){ e.stopPropagation(); }} style={{ width:"100%", background:T.ink, borderTopLeftRadius:20, borderTopRightRadius:20, padding:"10px 16px 24px", animation:"slideSheet 0.25s ease" }}>
        <div style={{ width:36, height:4, borderRadius:4, background:T.slate, margin:"6px auto 14px" }} />
        <p style={{ fontSize:12, color:T.ash, marginBottom:10 }}>Travel safe. If something feels off, you're in control.</p>
        <button onClick={reportUser} style={{ width:"100%", textAlign:"left", padding:"13px 12px", borderRadius:12, border:"none", background:T.charcoal, color:T.gold, fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:8 }}>🚩 Report {matchName}</button>
        <button onClick={blockUser} style={{ width:"100%", textAlign:"left", padding:"13px 12px", borderRadius:12, border:"none", background:T.charcoal, color:T.rose, fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:8 }}>🚫 Block {matchName}</button>
        <button onClick={function(){ setSafetyOpen(false); }} style={{ width:"100%", padding:"13px 12px", borderRadius:12, border:"1px solid "+T.glassBorder, background:"transparent", color:T.mist, fontSize:13, cursor:"pointer" }}>Cancel</button>
      </div>
    </div>}
    <div style={{ margin:"8px 14px", padding:"7px 11px", borderRadius:10, background:"linear-gradient(135deg,"+T.flame+"12,"+T.sunset+"08)",
      border:"1px solid "+T.flame+"25", display:"flex", alignItems:"center", gap:8 }}>
      <span>🗺️</span>
      <span style={{ fontSize:11, fontWeight:600 }}>Trip to {matchDest}</span>
      <span style={{ fontSize:10, color:T.ash }}>{matchDates}</span>
    </div>
    <div ref={scrollRef} style={{ flex:1, overflow:"auto", padding:"6px 14px", display:"flex", flexDirection:"column", gap:7 }}>
      {messages.map(renderMsg)}
      {isTyping && <div style={{ alignSelf:"flex-start", animation:"fadeIn 0.3s" }}>
        <div style={{ background:T.slate, borderRadius:16, borderBottomLeftRadius:4, padding:"9px 16px", display:"flex", gap:4, marginLeft:23 }}>
          {[0,1,2].map(function(i){ return <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:T.mist, animation:"typing 1.2s ease "+(i*0.2)+"s infinite" }} />; })}
        </div>
      </div>}
    </div>
    <div style={{ padding:"9px 14px 13px", display:"flex", gap:8, alignItems:"center",
      borderTop:"1px solid "+T.glass, background:"linear-gradient(to top,"+T.ink+","+T.midnight+")" }}>
      <button onClick={function(){setShowShare(true)}} style={{
        width:38, height:38, borderRadius:"50%", border:"none", background:"linear-gradient(135deg,"+T.flame+"22,"+T.sunset+"22)",
        color:T.coral, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>+</button>
      <input value={input} onChange={function(e){
        setInput(e.target.value);
        if (!isDemo && chatHook.sendTyping) chatHook.sendTyping(true);
      }} onKeyDown={function(e){if(e.key==="Enter")send()}}
        placeholder="Type a message..." style={{ flex:1, padding:"10px 14px", borderRadius:20, background:T.glass,
        border:"1px solid "+T.glassBorder, color:T.white, fontSize:13, outline:"none" }} />
      <button onClick={send} style={{ width:38, height:38, borderRadius:"50%", border:"none",
        background:input.trim()?"linear-gradient(135deg,"+T.flame+","+T.sunset+")":T.slate,
        color:T.white, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>↑</button>
    </div>
    {showShare && <ShareSheet onClose={function(){setShowShare(false)}} onShare={handleShare} />}

    {saveMsg && <div style={{ position:"fixed", bottom:78, left:0, right:0, display:"flex", justifyContent:"center", zIndex:70, pointerEvents:"none" }}>
      <div style={{ padding:"9px 16px", borderRadius:20, background:T.mint+"22", border:"1px solid "+T.mint+"55", color:T.mint, fontSize:12, fontWeight:600, animation:"fadeInUp 0.3s ease" }}>{saveMsg}</div>
    </div>}

    {saveFlight && <div onClick={function(){ setSaveFlight(null); }} style={{ position:"fixed", inset:0, zIndex:80, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"flex-end" }}>
      <div onClick={function(e){ e.stopPropagation(); }} style={{ width:"100%", maxWidth:480, margin:"0 auto", background:T.ink, borderRadius:"20px 20px 0 0", padding:"12px 16px 26px", animation:"slideSheet 0.3s cubic-bezier(0.34,1.56,0.64,1)", maxHeight:"70vh", overflow:"auto" }}>
        <div style={{ width:36, height:4, borderRadius:2, background:T.slate, margin:"0 auto 14px" }} />
        <h3 style={{ fontFamily:"'Fraunces',serif", fontSize:17, marginBottom:4 }}>Save flight to…</h3>
        <p style={{ fontSize:11, color:T.ash, marginBottom:12 }}>{saveFlight.airline} {saveFlight.flight_number} · {saveFlight.from} → {saveFlight.to}</p>
        {pickerTrips().map(function(t){
          return <button key={t.id} disabled={savingTo===t.id} onClick={function(){ saveFlightToTrip(t); }} style={{
            width:"100%", display:"flex", alignItems:"center", gap:11, padding:"13px 14px", marginBottom:8, borderRadius:14,
            border:"1px solid "+T.glassBorder, background:T.glass, color:T.white, cursor:"pointer", textAlign:"left" }}>
            <span style={{ fontSize:22 }}>{t.destination_emoji || "🌍"}</span>
            <span style={{ flex:1, fontSize:14, fontWeight:600 }}>{t.destination}</span>
            <span style={{ color:T.sky, fontSize:12, fontWeight:600 }}>{savingTo===t.id ? "Saving…" : "Save"}</span>
          </button>;
        })}
        <button onClick={function(){ setSaveFlight(null); }} style={{ width:"100%", padding:"12px", borderRadius:12, border:"1px solid "+T.glassBorder, background:"transparent", color:T.mist, fontSize:13, cursor:"pointer", marginTop:4 }}>Cancel</button>
      </div>
    </div>}
   </div>
  </div>;
}
