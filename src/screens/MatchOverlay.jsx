import { T } from "../theme";

export default function MatchOverlay({ match, userAvatar, onMessage, onClose }) {
  var colors = [T.flame,T.sunset,T.gold,T.mint,T.electric,T.rose];
  var matchDest = match.destination || match.shared_destination || "";
  var matchEmoji = match.destEmoji || match.destination_emoji || "🌍";
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
      <p style={{ color:T.mist, fontSize:13, marginBottom:28 }}>You and {match.name} want to explore {matchDest} {matchEmoji}</p>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:20, marginBottom:36 }}>
        <div style={{ width:80, height:80, borderRadius:"50%", border:"3px solid "+T.flame,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, background:T.charcoal }}>{userAvatar}</div>
        <div style={{ fontSize:24 }}>❤️</div>
        <div style={{ width:80, height:80, borderRadius:"50%", border:"3px solid "+T.sunset,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, background:T.charcoal }}>{match.avatar || "😎"}</div>
      </div>
      <button onClick={onMessage} style={{ width:240, padding:"13px", borderRadius:14, border:"none",
        background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", color:T.white, fontSize:14, fontWeight:600, cursor:"pointer", marginBottom:10 }}>Send a Message 💬</button>
      <br/>
      <button onClick={onClose} style={{ width:240, padding:"13px", borderRadius:14, border:"1px solid "+T.glassBorder,
        background:T.glass, color:T.white, fontSize:14, fontWeight:500, cursor:"pointer" }}>Keep Swiping</button>
    </div>
  </div>;
}
