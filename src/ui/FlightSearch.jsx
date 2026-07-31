import { useState } from "react";
import { T } from "../theme";
import { flightsService } from "../services/flights";
import AirportInput from "./AirportInput";

// ══════════════════════════════════════════════════════════════
// FlightSearch — reusable flight search form + results list.
// Used both in the chat Share sheet (pick → share to chat) and
// inside a Trip (pick → save to trip). The parent decides what
// "pick" does via onPick(result); pickLabel names the button.
// ══════════════════════════════════════════════════════════════
export default function FlightSearch({ onPick, pickLabel, presetOrigin, presetDestination }) {
  var [sp, setSp] = useState({
    origin: presetOrigin || "", destination: presetDestination || "",
    date: "", returnDate: "", adults: 1, roundTrip: false,
  });
  var [results, setResults] = useState(null);
  var [searching, setSearching] = useState(false);
  var [searchErr, setSearchErr] = useState("");

  var inp = { width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid "+T.glassBorder, background:T.glass, color:T.white, fontSize:12, outline:"none", marginBottom:7 };

  async function searchFlights() {
    if (!/^[A-Za-z]{3}$/.test((sp.origin||"").trim()) || !/^[A-Za-z]{3}$/.test((sp.destination||"").trim())) {
      setSearchErr("Pick a departure and destination airport."); return;
    }
    if (!sp.date) { setSearchErr("Pick a departure date."); return; }
    if (sp.roundTrip && !sp.returnDate) { setSearchErr("Pick a return date (or switch to one-way)."); return; }
    if (sp.roundTrip && sp.returnDate && sp.returnDate < sp.date) { setSearchErr("Return date must be on or after departure."); return; }
    setSearchErr(""); setSearching(true); setResults(null);
    var res = await flightsService.search({
      origin: sp.origin.trim(), destination: sp.destination.trim(), date: sp.date,
      returnDate: sp.roundTrip ? sp.returnDate : "", adults: sp.adults,
    });
    setSearching(false);
    if (res.error) { setSearchErr(res.error.message || "Search failed"); return; }
    setResults(res.data || []);
  }

  return <>
    {/* One-way / Round-trip */}
    <div style={{ display:"flex", gap:6, marginBottom:8 }}>
      {[{id:false,label:"One-way"},{id:true,label:"Round-trip"}].map(function(o){
        var active = sp.roundTrip === o.id;
        return <button key={String(o.id)} onClick={function(){ setSp({...sp, roundTrip:o.id}); }} style={{
          flex:1, padding:"8px", borderRadius:9, cursor:"pointer", fontSize:11, fontWeight:600,
          border:"1px solid "+(active ? T.sky : T.glassBorder), background: active ? T.sky+"1e" : T.glass, color: active ? T.sky : T.mist }}>{o.label}</button>;
      })}
    </div>
    <div style={{ display:"flex", gap:6, marginBottom:7 }}>
      <AirportInput value={sp.origin} placeholder="From — city or airport" onSelect={function(code){ setSp({...sp,origin:code}); }} />
      <AirportInput value={sp.destination} placeholder="To — city or airport" onSelect={function(code){ setSp({...sp,destination:code}); }} />
    </div>
    <div style={{ display:"flex", gap:6 }}>
      <div style={{ flex:1 }}>
        <label style={{ fontSize:9, color:T.ash, marginLeft:2 }}>Depart</label>
        <input style={inp} type="date" value={sp.date} onChange={function(e){setSp({...sp,date:e.target.value})}} />
      </div>
      {sp.roundTrip && <div style={{ flex:1 }}>
        <label style={{ fontSize:9, color:T.ash, marginLeft:2 }}>Return</label>
        <input style={inp} type="date" min={sp.date||undefined} value={sp.returnDate} onChange={function(e){setSp({...sp,returnDate:e.target.value})}} />
      </div>}
      <div style={{ width:96 }}>
        <label style={{ fontSize:9, color:T.ash, marginLeft:2 }}>Travelers</label>
        <div style={{ display:"flex", alignItems:"center", gap:4, ...inp, padding:"5px 6px" }}>
          <button onClick={function(){ setSp({...sp, adults:Math.max(1, sp.adults-1)}); }} style={{ width:24, height:24, borderRadius:7, border:"1px solid "+T.glassBorder, background:T.glass, color:T.white, cursor:"pointer", fontSize:14 }}>−</button>
          <span style={{ flex:1, textAlign:"center", fontSize:12, fontWeight:600 }}>{sp.adults}</span>
          <button onClick={function(){ setSp({...sp, adults:Math.min(9, sp.adults+1)}); }} style={{ width:24, height:24, borderRadius:7, border:"1px solid "+T.glassBorder, background:T.glass, color:T.white, cursor:"pointer", fontSize:14 }}>+</button>
        </div>
      </div>
    </div>
    <button onClick={searchFlights} disabled={searching} style={{ width:"100%", padding:"11px", borderRadius:12, border:"none",
      background: searching ? T.slate : "linear-gradient(135deg,"+T.sky+","+T.electric+")", color:T.white, fontSize:12, fontWeight:600, cursor: searching ? "default" : "pointer", marginBottom:8, marginTop:8 }}>
      {searching ? "Searching…" : "Search Flights 🔎"}
    </button>
    {searchErr && <p style={{ color:T.rose, fontSize:11, marginBottom:8 }}>⚠️ {searchErr}</p>}
    {results && results.length === 0 && !searchErr && <p style={{ color:T.ash, fontSize:12 }}>No flights found for that route/date.</p>}
    {results && results.map(function(r){
      return <div key={r.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 11px", marginBottom:7,
        borderRadius:12, background:T.glass, border:"1px solid "+T.glassBorder }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:11, fontWeight:600 }}>{r.airline}</span>
            <span style={{ fontSize:9, color:T.ash }}>{r.flight_number}</span>
            {r.roundTrip && <span style={{ fontSize:8, padding:"1px 6px", borderRadius:6, background:T.sky+"22", color:T.sky, fontWeight:600 }}>ROUND-TRIP</span>}
          </div>
          <div style={{ fontSize:10, color:T.mist, marginTop:2 }}>
            ↗ {r.departTime} {r.from} → {r.arriveTime} {r.to} · {r.duration}{typeof r.stops==="number" ? " · "+(r.stops===0?"Direct":r.stops+" stop"+(r.stops>1?"s":"")) : ""}
          </div>
          {r.roundTrip && <div style={{ fontSize:10, color:T.mist, marginTop:1 }}>
            ↙ {r.returnDepartTime} {r.to} → {r.returnArriveTime} {r.from} · {r.returnDuration}{typeof r.returnStops==="number" ? " · "+(r.returnStops===0?"Direct":r.returnStops+" stop"+(r.returnStops>1?"s":"")) : ""}
          </div>}
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.gold }}>${r.price}</div>
          <div style={{ fontSize:8, color:T.ash }}>total</div>
          <button onClick={function(){ onPick(r); }} style={{ marginTop:3, padding:"4px 10px", borderRadius:8, border:"none",
            background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", color:T.white, fontSize:10, fontWeight:600, cursor:"pointer" }}>{pickLabel || "Share"}</button>
        </div>
      </div>;
    })}
  </>;
}
