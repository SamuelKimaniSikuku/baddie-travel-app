import { useState } from "react";
import { T } from "../theme";
import { useConversations } from "../hooks/useSupabase";
import { isDemo } from "../lib/supabase";

export default function ChatsListScreen({ matches, userId, onOpenChat }) {
  var [search, setSearch] = useState("");
  var convos = useConversations(isDemo ? null : userId);
  var displayList = isDemo ? matches : (convos.conversations || []);
  var filtered = displayList.filter(function(m){
    var name = m.name || (m.match ? (m.match.user1?.name || m.match.user2?.name) : "") || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

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
        var displayName = m.name || "";
        var displayAvatar = m.avatar || "😎";
        var displayDest = m.destination || m.shared_destination || "";
        var displayDestEmoji = m.destEmoji || m.destination_emoji || "🌍";
        var lastMsg = m.lastMessage ? m.lastMessage.content : "Matched! Say hi 👋";
        var unread = m.unreadCount || 0;
        if (!isDemo && m.match) {
          var otherUser = m.match.user1?.id === userId ? m.match.user2 : m.match.user1;
          displayName = otherUser?.name || "Traveler";
          displayAvatar = otherUser?.avatar || "😎";
          displayDest = m.match.shared_destination || "";
        }
        return <div key={m.id} onClick={function(){onOpenChat(m)}} style={{
          display:"flex", alignItems:"center", gap:12, padding:"13px 0",
          borderBottom:"1px solid "+T.glass, cursor:"pointer",
          animation:"fadeInUp 0.3s ease "+(i*0.04)+"s both"
        }}>
          <div style={{ width:48, height:48, borderRadius:"50%", background:T.charcoal, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:24, border:"2px solid "+T.glassBorder, position:"relative" }}>
            {displayAvatar}
            <div style={{ position:"absolute", bottom:0, right:0, width:12, height:12, borderRadius:"50%", background:T.mint, border:"2px solid "+T.midnight }} />
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
              <span style={{ fontWeight:600, fontSize:14 }}>{displayName}</span>
              <span style={{ color:T.ash, fontSize:10 }}>Now</span>
            </div>
            <p style={{ color:T.mist, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{lastMsg}</p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
            <div style={{ background:"linear-gradient(135deg,"+T.flame+"44,"+T.sunset+"44)", borderRadius:8, padding:"3px 8px", fontSize:10, color:T.coral }}>
              {displayDestEmoji} {displayDest}
            </div>
            {unread > 0 && <div style={{ background:T.flame, borderRadius:10, padding:"1px 7px", fontSize:10, fontWeight:700 }}>{unread}</div>}
          </div>
        </div>;
      })}
    </div>
  </div>;
}
