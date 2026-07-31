import { useState } from "react";
import { T } from "../theme";
import FlightSearch from "../ui/FlightSearch";

var SHARE_OPTIONS = [
  { id:"flight", icon:"✈️", label:"Flight", color:T.sky },
  { id:"itinerary", icon:"📋", label:"Day Plan", color:T.mint },
  { id:"expense", icon:"💰", label:"Expense", color:T.gold },
  { id:"poll", icon:"📊", label:"Poll", color:T.violet },
  { id:"packing", icon:"🎒", label:"Packing", color:T.coral },
  { id:"checklist", icon:"✅", label:"Checklist", color:T.lime },
  { id:"location", icon:"📍", label:"Location", color:T.rose },
];

export function FlightCard({ data, isMine }) {
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
          {data.departTime && <div style={{ fontSize:9, fontWeight:600, color:T.sky }}>{data.departTime}</div>}
          <div style={{ fontSize:8, color:T.ash }}>{data.fromCity}</div>
        </div>
        <div style={{ flex:1, margin:"0 8px", height:1, background:T.mist+"44", position:"relative" }}>
          <div style={{ position:"absolute", left:"50%", transform:"translateX(-50%)", top:-7, fontSize:8, color:T.mist, background:T.midnight, padding:"0 4px", whiteSpace:"nowrap" }}>
            {data.duration||"—"}{typeof data.stops === "number" ? " · " + (data.stops === 0 ? "Direct" : data.stops + " stop" + (data.stops > 1 ? "s" : "")) : ""}
          </div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:16, fontWeight:800, fontFamily:"'Fraunces',serif" }}>{data.to}</div>
          {data.arriveTime && <div style={{ fontSize:9, fontWeight:600, color:T.sky }}>{data.arriveTime}</div>}
          <div style={{ fontSize:8, color:T.ash }}>{data.toCity}</div>
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10 }}>
        <span style={{ color:T.mist }}>{data.date||""}</span>
        <span style={{ fontWeight:700, color:T.gold }}>${data.price}{data.currency && data.currency !== "USD" ? " " + data.currency : ""}</span>
      </div>
      {data.roundTrip && <div style={{ marginTop:6, paddingTop:6, borderTop:"1px dashed "+T.glassBorder, display:"flex", justifyContent:"space-between", fontSize:9, color:T.mist }}>
        <span style={{ color:T.sky, fontWeight:600 }}>↩ Return {data.returnDate||""}</span>
        <span>{data.returnDepartTime} → {data.returnArriveTime}</span>
      </div>}
    </div>
    <button style={{ width:"100%", padding:7, border:"none", borderTop:"1px solid "+T.glassBorder,
      background:"transparent", color:T.sky, fontSize:10, fontWeight:600, cursor:"pointer" }}>📌 Save to Trip</button>
  </div>;
}

export function PollCard({ data, onVote }) {
  var total = data.options.reduce(function(s,o){ return s+(o.votes||[]).length; }, 0);
  return <div style={{ borderRadius:14, overflow:"hidden", width:250, background:"rgba(255,255,255,0.05)", border:"1px solid "+T.glassBorder }}>
    <div style={{ padding:"7px 11px", background:T.violet+"12", borderBottom:"1px solid "+T.glassBorder }}>
      <span style={{ fontSize:11, fontWeight:600 }}>📊 {data.question}</span>
    </div>
    <div style={{ padding:"6px 10px", display:"flex", flexDirection:"column", gap:5 }}>
      {data.options.map(function(opt) {
        var pct = total > 0 ? ((opt.votes||[]).length/total)*100 : 0;
        var voted = (opt.votes||[]).includes("me");
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

export function ItineraryCard({ data }) {
  return <div style={{ borderRadius:14, overflow:"hidden", width:250, background:"rgba(255,255,255,0.05)", border:"1px solid "+T.glassBorder }}>
    <div style={{ padding:"7px 11px", background:T.mint+"12", borderBottom:"1px solid "+T.glassBorder, display:"flex", justifyContent:"space-between" }}>
      <span style={{ fontSize:11, fontWeight:600 }}>📋 {data.title}</span>
      <span style={{ fontSize:9, color:T.ash }}>{data.date}</span>
    </div>
    <div style={{ padding:"4px 0" }}>
      {(data.activities||[]).map(function(a,i){
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

export function ExpenseCard({ data }) {
  return <div style={{ borderRadius:14, overflow:"hidden", width:250, background:"rgba(255,255,255,0.05)", border:"1px solid "+T.glassBorder }}>
    <div style={{ padding:"7px 11px", background:T.gold+"12", borderBottom:"1px solid "+T.glassBorder }}>
      <span style={{ fontSize:11, fontWeight:600 }}>💰 {data.title}</span>
    </div>
    <div style={{ padding:"4px 0" }}>
      {(data.items||[]).map(function(item,i){
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

export function ChecklistCard({ data }) {
  return <div style={{ borderRadius:14, overflow:"hidden", width:250, background:"rgba(255,255,255,0.05)", border:"1px solid "+T.glassBorder }}>
    <div style={{ padding:"7px 11px", background:T.lime+"12", borderBottom:"1px solid "+T.glassBorder }}>
      <span style={{ fontSize:11, fontWeight:600 }}>✅ {data.title}</span>
    </div>
    <div style={{ padding:"4px 10px" }}>
      {(data.items||[]).map(function(item,i){
        return <div key={i} style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 0" }}>
          <span style={{ fontSize:11 }}>{item.done?"✅":"⬜"}</span>
          <span style={{ fontSize:10, color:item.done?T.ash:T.white, textDecoration:item.done?"line-through":"none" }}>{item.text}</span>
        </div>;
      })}
    </div>
  </div>;
}

export function ShareSheet({ onClose, onShare }) {
  var [selected, setSelected] = useState(null);
  var [fd, setFd] = useState({airline:"",flight_number:"",from:"",fromCity:"",to:"",toCity:"",price:"",date:"",duration:""});
  var [pd, setPd] = useState({question:"",options:["",""]});
  var [cd, setCd] = useState({title:"",items:["",""]});
  // Flight share mode: search vs manual entry
  var [flightMode, setFlightMode] = useState("search"); // "search" | "manual"
  var inp = { width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid "+T.glassBorder, background:T.glass, color:T.white, fontSize:12, outline:"none", marginBottom:7 };

  function shareResult(r) {
    onShare("flight", { ...r, status:"found" });
    onClose();
  }

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

        {/* Search / Manual tabs */}
        <div style={{ display:"flex", gap:6, marginBottom:12, background:T.glass, borderRadius:10, padding:3 }}>
          {[{id:"search",label:"🔎 Search"},{id:"manual",label:"✍️ Enter manually"}].map(function(tab){
            var active = flightMode === tab.id;
            return <button key={tab.id} onClick={function(){setFlightMode(tab.id)}} style={{
              flex:1, padding:"8px", borderRadius:8, border:"none", cursor:"pointer", fontSize:11, fontWeight:600,
              background: active ? T.flame : "transparent", color: active ? T.white : T.mist }}>{tab.label}</button>;
          })}
        </div>

        {flightMode === "search" ? <>
          <FlightSearch pickLabel="Share" onPick={shareResult} />
        </> : <>
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
        </>}
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
