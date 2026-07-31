import { useState, useEffect } from "react";
import { T } from "../theme";
import Glass from "../ui/Glass";
import FlightSearch from "../ui/FlightSearch";
import { useTrips } from "../hooks/useSupabase";
import { tripsService } from "../services/trips";
import { isDemo } from "../lib/supabase";

var EMOJI_CHOICES = ["🌍","🏝️","🏔️","🏖️","🗼","🏙️","🛕","🎒","✈️","🚆","🌋","🏜️","🌴","⛩️","🗽","🎡"];

// Normalize a match (live row OR demo traveler) into a buddy {id,name,avatar}.
function normalizeBuddy(match, userId) {
  if (!match) return null;
  // Live match rows carry user1/user2 profile joins.
  if (match.user1 || match.user2) {
    var other = match.user1_id === userId ? match.user2 : match.user1;
    if (!other) return null;
    return { id: other.id, name: other.name, avatar: other.avatar || "😎" };
  }
  // Demo travelers are plain profile-like objects.
  return { id: match.id, name: match.name, avatar: match.avatar || "😎" };
}

// Build a human date range like "Mar 15 – Apr 2".
function formatRange(start, end) {
  if (!start) return "";
  var opts = { month: "short", day: "numeric" };
  var s = new Date(start + "T00:00:00").toLocaleDateString("en-US", opts);
  if (!end) return s;
  var e = new Date(end + "T00:00:00").toLocaleDateString("en-US", opts);
  return s + " – " + e;
}

// Days until a trip starts (null if no/invalid date). Negative once started.
function daysAway(start) {
  if (!start) return null;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var d = new Date(start + "T00:00:00");
  return Math.round((d - today) / 86400000);
}

// Today as a YYYY-MM-DD string in local time (for date input `min`/compare).
function todayStr() {
  var d = new Date();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

function startOf(trip) { return trip.start_date || null; }
function endOf(trip) { return trip.end_date || trip.start_date || null; }

// A trip is "past" once its end date is strictly before today.
function isPast(trip) {
  var end = endOf(trip);
  if (!end) return false;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  return new Date(end + "T00:00:00") < today;
}

export default function TripsScreen({ matches, userId }) {
  var tripsHook = useTrips(isDemo ? null : userId);

  var [demoTrips, setDemoTrips] = useState([
    { id:"t1", destination:"Bali", destination_emoji:"🇮🇩", start_date:"2026-07-15", end_date:"2026-08-02",
      date_display:"Jul 15 – Aug 2", status:"planning", buddy:normalizeBuddy(matches[0], userId),
      items:[{id:"i1",title:"Book flights",completed:true},{id:"i2",title:"Reserve villa",completed:true},
        {id:"i3",title:"Yoga retreat",completed:false},{id:"i4",title:"Volcano trek",completed:false}] },
  ]);
  var [expanded, setExpanded] = useState(null);
  var [newItem, setNewItem] = useState("");
  var [showCreate, setShowCreate] = useState(false);
  var [tab, setTab] = useState("checklist"); // "checklist" | "flights"

  // Live checklist for the expanded trip.
  var [liveItems, setLiveItems] = useState([]);
  var [itemsLoading, setItemsLoading] = useState(false);

  // Live flights for the expanded trip.
  var [liveFlights, setLiveFlights] = useState([]);
  var [flightsLoading, setFlightsLoading] = useState(false);
  var [showFlightSearch, setShowFlightSearch] = useState(false);

  var trips = isDemo ? demoTrips : (tripsHook.trips || []);

  // Reset to the checklist tab each time a trip is opened.
  useEffect(function(){ setTab("checklist"); setShowFlightSearch(false); }, [expanded]);

  // Load real itinerary items whenever a trip is expanded in live mode.
  useEffect(function(){
    if (isDemo || !expanded) return;
    var active = true;
    setItemsLoading(true);
    tripsService.getChecklist(expanded).then(function(res){
      if (!active) return;
      setLiveItems(res.data || []);
      setItemsLoading(false);
    });
    return function(){ active = false; };
  }, [expanded]);

  // Load saved flights whenever a trip is expanded in live mode.
  useEffect(function(){
    if (isDemo || !expanded) return;
    var active = true;
    setFlightsLoading(true);
    tripsService.getFlights(expanded).then(function(res){
      if (!active) return;
      setLiveFlights(res.data || []);
      setFlightsLoading(false);
    });
    return function(){ active = false; };
  }, [expanded]);

  function currentFlights(trip) {
    if (isDemo) return trip.flights || [];
    return liveFlights;
  }

  async function saveFlight(trip, result) {
    setShowFlightSearch(false);
    if (isDemo) {
      var demoFlight = { ...result, id: "df" + Date.now() };
      setDemoTrips(function(p){ return p.map(function(t){
        return t.id===trip.id ? {...t, flights:(t.flights||[]).concat([demoFlight])} : t;
      }); });
      return;
    }
    var res = await tripsService.addFlight(trip.id, result, userId);
    if (res.data) setLiveFlights(function(prev){ return prev.concat([res.data]); });
  }

  async function removeFlight(trip, flight) {
    if (isDemo) {
      setDemoTrips(function(p){ return p.map(function(t){
        return t.id===trip.id ? {...t, flights:(t.flights||[]).filter(function(f){ return f.id!==flight.id; })} : t;
      }); });
      return;
    }
    setLiveFlights(function(prev){ return prev.filter(function(f){ return f.id!==flight.id; }); });
    await tripsService.deleteFlight(flight.id);
  }

  function currentItems(trip) {
    if (isDemo) return trip.items || [];
    return liveItems;
  }

  async function addItem(trip) {
    var title = newItem.trim();
    if (!title) return;
    setNewItem("");
    if (isDemo) {
      setDemoTrips(function(p){ return p.map(function(t){
        return t.id===trip.id ? {...t, items:t.items.concat([{id:"i"+Date.now(),title:title,completed:false}])} : t;
      }); });
      return;
    }
    var res = await tripsService.addChecklistItem(trip.id, title, userId);
    if (res.data) setLiveItems(function(prev){ return prev.concat([res.data]); });
  }

  async function toggleItem(trip, item) {
    if (isDemo) {
      setDemoTrips(function(p){ return p.map(function(t){
        return t.id===trip.id ? {...t, items:t.items.map(function(it){ return it.id===item.id?{...it,completed:!it.completed}:it; })} : t;
      }); });
      return;
    }
    var next = !item.completed;
    setLiveItems(function(prev){ return prev.map(function(it){ return it.id===item.id?{...it,completed:next}:it; }); });
    await tripsService.toggleItemComplete(item.id, next);
  }

  // ── Expanded trip view ──
  if (expanded) {
    var trip = trips.find(function(t){return t.id===expanded});
    if (!trip) { setExpanded(null); return null; }
    var items = currentItems(trip);
    var done = items.filter(function(i){return i.completed}).length;
    var away = daysAway(startOf(trip));
    return <div style={{ flex:1, overflow:"auto", padding:"0 16px 16px", animation:"fadeIn 0.3s" }}>
      <button onClick={function(){setExpanded(null)}} style={{ background:"none", border:"none", color:T.mist, fontSize:13, cursor:"pointer", marginBottom:14, display:"flex", alignItems:"center", gap:5 }}>← Back</button>
      <Glass style={{ padding:18, marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
          <span style={{ fontSize:28 }}>{trip.destination_emoji || trip.flag || "🌍"}</span>
          <div><h2 style={{ fontFamily:"'Fraunces',serif", fontSize:22 }}>{trip.destination}</h2><p style={{ color:T.ash, fontSize:11 }}>{trip.date_display || formatRange(trip.start_date, trip.end_date) || ""}</p></div>
          <span style={{ marginLeft:"auto", padding:"3px 10px", borderRadius:8, fontSize:10, fontWeight:600, background:T.mint+"22", color:T.mint, textTransform:"capitalize" }}>{trip.status}</span>
        </div>
        {away !== null && away >= 0 && <div style={{ fontSize:11, color:T.coral, marginTop:4 }}>
          {away === 0 ? "🎉 Starts today!" : "⏳ " + away + (away === 1 ? " day away" : " days away")}
        </div>}
        {items.length > 0 && <>
          <div style={{ height:5, borderRadius:3, background:T.slate, marginTop:10 }}>
            <div style={{ height:"100%", borderRadius:3, width:(done/items.length*100)+"%", background:"linear-gradient(90deg,"+T.mint+","+T.lime+")", transition:"width 0.4s" }} />
          </div>
          <div style={{ fontSize:10, color:T.ash, marginTop:4 }}>{done}/{items.length} completed</div>
        </>}
      </Glass>
      {/* Checklist / Flights tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:12, background:T.glass, borderRadius:10, padding:3 }}>
        {[{id:"checklist",label:"✅ Checklist"},{id:"flights",label:"✈️ Flights"}].map(function(t){
          var active = tab === t.id;
          return <button key={t.id} onClick={function(){ setTab(t.id); }} style={{
            flex:1, padding:"8px", borderRadius:8, border:"none", cursor:"pointer", fontSize:11, fontWeight:600,
            background: active ? T.flame : "transparent", color: active ? T.white : T.mist }}>{t.label}</button>;
        })}
      </div>

      {tab === "checklist" ? <>
        {itemsLoading && <p style={{ color:T.ash, fontSize:12, padding:"4px 2px" }}>Loading…</p>}
        {!itemsLoading && items.length === 0 && <p style={{ color:T.ash, fontSize:12, padding:"4px 2px" }}>No tasks yet — add your first below.</p>}
        {items.map(function(item){
          return <div key={item.id} onClick={function(){toggleItem(trip,item)}} style={{
            display:"flex", alignItems:"center", gap:11, padding:"11px 14px", marginBottom:6,
            background:T.glass, border:"1px solid "+T.glassBorder, borderRadius:12, cursor:"pointer", opacity:item.completed?0.5:1 }}>
            <div style={{ width:20, height:20, borderRadius:6, border:item.completed?"none":"2px solid "+T.ash,
              background:item.completed?"linear-gradient(135deg,"+T.mint+","+T.lime+")":"none",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:11 }}>{item.completed?"✓":""}</div>
            <span style={{ fontSize:13, textDecoration:item.completed?"line-through":"none", color:item.completed?T.ash:T.white }}>{item.title}</span>
          </div>;
        })}
        <div style={{ display:"flex", gap:8, marginTop:10 }}>
          <input value={newItem} onChange={function(e){setNewItem(e.target.value)}} onKeyDown={function(e){if(e.key==="Enter")addItem(trip)}}
            placeholder="Add a task..." style={{ flex:1, padding:"11px 14px", borderRadius:12, background:T.glass, border:"1px solid "+T.glassBorder, color:T.white, fontSize:13, outline:"none" }} />
          <button onClick={function(){addItem(trip)}} style={{ padding:"11px 18px", borderRadius:12, border:"none",
            background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", color:T.white, fontWeight:600, cursor:"pointer", fontSize:12 }}>Add</button>
        </div>
      </> : <FlightsTab
        trip={trip}
        flights={currentFlights(trip)}
        loading={!isDemo && flightsLoading}
        showSearch={showFlightSearch}
        onToggleSearch={function(){ setShowFlightSearch(function(v){ return !v; }); }}
        onSave={function(r){ saveFlight(trip, r); }}
        onRemove={function(f){ removeFlight(trip, f); }}
      />}
    </div>;
  }

  // ── Create-trip overlay ──
  if (showCreate) {
    return <CreateTripForm
      matches={matches}
      userId={userId}
      onCancel={function(){ setShowCreate(false); }}
      onCreate={async function(payload){
        if (isDemo) {
          var buddy = payload.buddyMatch ? normalizeBuddy(payload.buddyMatch, userId) : null;
          setDemoTrips(function(p){ return p.concat([{
            id:"t"+Date.now(), destination:payload.destination, destination_emoji:payload.emoji,
            start_date:payload.startDate, end_date:payload.endDate, date_display:payload.dateDisplay,
            status:"planning", buddy:buddy, items:[],
          }]); });
          setShowCreate(false);
          return;
        }
        var buddy = payload.buddyMatch ? normalizeBuddy(payload.buddyMatch, userId) : null;
        await tripsHook.createTrip({
          destination: payload.destination,
          emoji: payload.emoji,
          startDate: payload.startDate || null,
          endDate: payload.endDate || null,
          dateDisplay: payload.dateDisplay,
          memberIds: buddy ? [buddy.id] : [],
        });
        setShowCreate(false);
      }}
    />;
  }

  // ── Trip list (grouped) ──
  var upcoming = trips.filter(function(t){ return !isPast(t); });
  var past = trips.filter(isPast);

  return <div style={{ flex:1, overflow:"auto", padding:"0 16px 16px" }}>
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 0 10px" }}>
      <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:20 }}>Trips</h2>
      <button onClick={function(){ setShowCreate(true); }} style={{ padding:"8px 14px", borderRadius:12, border:"none",
        background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")", color:T.white, fontWeight:600, cursor:"pointer", fontSize:12 }}>+ New Trip</button>
    </div>

    {trips.length === 0 ? <div style={{ textAlign:"center", padding:40 }}>
      <div style={{ fontSize:44, marginBottom:10 }}>🗺️</div>
      <h3 style={{ fontFamily:"'Fraunces',serif" }}>No trips yet</h3>
      <p style={{ color:T.ash, fontSize:12 }}>Tap “+ New Trip” to start planning!</p>
    </div> : <>
      {upcoming.length > 0 && <Section label="Upcoming" trips={upcoming} userId={userId} onOpen={setExpanded} showCountdown />}
      {past.length > 0 && <Section label="Past" trips={past} userId={userId} onOpen={setExpanded} />}
    </>}
  </div>;
}

// ── Grouped section of trip cards ──
function Section({ label, trips, userId, onOpen, showCountdown }) {
  return <>
    <h3 style={{ fontSize:11, color:T.ash, textTransform:"uppercase", letterSpacing:2, margin:"8px 0 10px" }}>{label}</h3>
    {trips.map(function(trip, i){
      var emoji = trip.destination_emoji || trip.flag || "🌍";
      var dates = trip.date_display || formatRange(trip.start_date, trip.end_date) || "";
      var itemCount = (trip.items || []).length;
      var buddy = trip.buddy || normalizeBuddy((trip.members || []).find(function(m){ return m && m.id !== userId; }), userId);
      var away = daysAway(trip.start_date);
      return <Glass key={trip.id} onClick={function(){onOpen(trip.id)}} style={{
        padding:16, marginBottom:10, cursor:"pointer", animation:"fadeInUp 0.3s ease "+(i*0.06)+"s both" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"start", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:24 }}>{emoji}</span>
            <div><h3 style={{ fontFamily:"'Fraunces',serif", fontSize:17 }}>{trip.destination}</h3><p style={{ color:T.ash, fontSize:11 }}>{dates}</p></div>
          </div>
          <span style={{ padding:"3px 9px", borderRadius:8, fontSize:10, fontWeight:600, background:T.mint+"22", color:T.mint, textTransform:"capitalize" }}>{trip.status}</span>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          {buddy ? <div style={{ width:28, height:28, borderRadius:"50%", background:T.charcoal, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>{buddy.avatar || "😎"}</div> : <span />}
          {showCountdown && away !== null && away >= 0
            ? <span style={{ padding:"3px 9px", borderRadius:8, fontSize:10, fontWeight:600, background:T.flame+"1c", color:T.coral }}>
                {away === 0 ? "Today" : away + (away === 1 ? " day" : " days") + " away"}
              </span>
            : <span style={{ color:T.ash, fontSize:11 }}>{itemCount} tasks</span>}
        </div>
      </Glass>;
    })}
  </>;
}

// ── Flights tab (saved flights + search-to-add) ──
function FlightsTab({ trip, flights, loading, showSearch, onToggleSearch, onSave, onRemove }) {
  if (showSearch) {
    return <div style={{ animation:"fadeIn 0.2s" }}>
      <button onClick={onToggleSearch} style={{ background:"none", border:"none", color:T.mist, fontSize:12, cursor:"pointer", marginBottom:10 }}>← Back to saved flights</button>
      <FlightSearch
        pickLabel="Add"
        presetDestination={/^[A-Za-z]{3}$/.test((trip.destination_iata||"")) ? trip.destination_iata : ""}
        onPick={onSave}
      />
    </div>;
  }

  return <div style={{ animation:"fadeIn 0.2s" }}>
    {loading && <p style={{ color:T.ash, fontSize:12, padding:"4px 2px" }}>Loading…</p>}
    {!loading && flights.length === 0 && <div style={{ textAlign:"center", padding:"24px 8px" }}>
      <div style={{ fontSize:32, marginBottom:6 }}>🛫</div>
      <p style={{ color:T.ash, fontSize:12 }}>No flights saved to this trip yet.</p>
    </div>}
    {flights.map(function(f){
      return <div key={f.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 13px", marginBottom:8,
        borderRadius:14, background:T.glass, border:"1px solid "+T.glassBorder }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:12, fontWeight:700 }}>{f.airline}</span>
            <span style={{ fontSize:9, color:T.ash }}>{f.flight_number}</span>
            {f.roundTrip && <span style={{ fontSize:8, padding:"1px 6px", borderRadius:6, background:T.sky+"22", color:T.sky, fontWeight:600 }}>ROUND-TRIP</span>}
          </div>
          <div style={{ fontSize:10, color:T.mist, marginTop:3 }}>
            ↗ {f.departTime} {f.from} → {f.arriveTime} {f.to} · {f.duration}{typeof f.stops==="number" ? " · "+(f.stops===0?"Direct":f.stops+" stop"+(f.stops>1?"s":"")) : ""}
          </div>
          {f.roundTrip && <div style={{ fontSize:10, color:T.mist, marginTop:1 }}>
            ↙ {f.returnDepartTime} {f.to} → {f.returnArriveTime} {f.from} · {f.returnDuration}
          </div>}
          {f.date && <div style={{ fontSize:9, color:T.ash, marginTop:2 }}>{f.date}{f.roundTrip && f.returnDate ? " – " + f.returnDate : ""}</div>}
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.gold }}>${f.price}</div>
          <button onClick={function(){ onRemove(f); }} title="Remove" style={{ marginTop:4, background:"none", border:"none", color:T.rose, fontSize:14, cursor:"pointer" }}>🗑</button>
        </div>
      </div>;
    })}
    <button onClick={onToggleSearch} style={{ width:"100%", marginTop:6, padding:"12px", borderRadius:12, border:"1px dashed "+T.sky+"55",
      background:T.sky+"10", color:T.sky, fontSize:12, fontWeight:600, cursor:"pointer" }}>＋ Search & add flight</button>
  </div>;
}

// ── New Trip form ──
function CreateTripForm({ matches, userId, onCancel, onCreate }) {
  var [destination, setDestination] = useState("");
  var [emoji, setEmoji] = useState("🌍");
  var [startDate, setStartDate] = useState("");
  var [endDate, setEndDate] = useState("");
  var [buddyId, setBuddyId] = useState("");
  var [saving, setSaving] = useState(false);

  // Build a selectable buddy list from matches.
  var buddyOptions = (matches || []).map(function(m){ return { match:m, buddy:normalizeBuddy(m, userId) }; })
    .filter(function(o){ return o.buddy; });

  var minDate = todayStr();
  // Validate dates: any provided date must be today or later, and end must
  // not fall before start.
  var dateError = "";
  if (startDate && startDate < minDate) dateError = "Start date can't be in the past.";
  else if (endDate && endDate < minDate) dateError = "End date can't be in the past.";
  else if (startDate && endDate && endDate < startDate) dateError = "End date must be after the start date.";

  var canSave = destination.trim().length > 0 && !dateError && !saving;

  async function submit() {
    if (!canSave) return;
    setSaving(true);
    var chosen = buddyOptions.find(function(o){ return o.buddy.id === buddyId; });
    await onCreate({
      destination: destination.trim(),
      emoji: emoji,
      startDate: startDate || null,
      endDate: endDate || null,
      dateDisplay: formatRange(startDate, endDate),
      buddyMatch: chosen ? chosen.match : null,
    });
    setSaving(false);
  }

  var inputStyle = { width:"100%", padding:"11px 14px", borderRadius:12, background:T.glass, border:"1px solid "+T.glassBorder, color:T.white, fontSize:13, outline:"none", boxSizing:"border-box" };
  var labelStyle = { fontSize:11, color:T.ash, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6, display:"block" };

  return <div style={{ flex:1, overflow:"auto", padding:"0 16px 24px", animation:"fadeIn 0.3s" }}>
    <button onClick={onCancel} style={{ background:"none", border:"none", color:T.mist, fontSize:13, cursor:"pointer", margin:"14px 0", display:"flex", alignItems:"center", gap:5 }}>← Cancel</button>
    <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:22, marginBottom:16 }}>New Trip</h2>

    <div style={{ marginBottom:16 }}>
      <label style={labelStyle}>Destination</label>
      <input value={destination} onChange={function(e){setDestination(e.target.value)}} placeholder="Where to?" style={inputStyle} />
    </div>

    <div style={{ marginBottom:16 }}>
      <label style={labelStyle}>Pick an icon</label>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {EMOJI_CHOICES.map(function(em){
          var active = em === emoji;
          return <button key={em} onClick={function(){setEmoji(em)}} style={{
            width:40, height:40, borderRadius:10, fontSize:20, cursor:"pointer",
            background: active ? T.flame+"22" : T.glass, border:"1px solid "+(active ? T.flame : T.glassBorder) }}>{em}</button>;
        })}
      </div>
    </div>

    <div style={{ display:"flex", gap:10, marginBottom: dateError ? 6 : 16 }}>
      <div style={{ flex:1 }}>
        <label style={labelStyle}>Start</label>
        <input type="date" value={startDate} min={minDate} onChange={function(e){setStartDate(e.target.value)}} style={inputStyle} />
      </div>
      <div style={{ flex:1 }}>
        <label style={labelStyle}>End</label>
        <input type="date" value={endDate} min={startDate || minDate} onChange={function(e){setEndDate(e.target.value)}} style={inputStyle} />
      </div>
    </div>
    {dateError && <p style={{ color:T.rose, fontSize:11, marginBottom:16 }}>⚠️ {dateError}</p>}

    {buddyOptions.length > 0 && <div style={{ marginBottom:16 }}>
      <label style={labelStyle}>Travel buddy (optional)</label>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {buddyOptions.map(function(o){
          var active = o.buddy.id === buddyId;
          return <button key={o.buddy.id} onClick={function(){ setBuddyId(active ? "" : o.buddy.id); }} style={{
            display:"flex", alignItems:"center", gap:7, padding:"7px 12px", borderRadius:20, cursor:"pointer",
            background: active ? T.flame+"22" : T.glass, border:"1px solid "+(active ? T.flame : T.glassBorder), color:T.white, fontSize:12 }}>
            <span style={{ fontSize:15 }}>{o.buddy.avatar}</span>{o.buddy.name}
          </button>;
        })}
      </div>
    </div>}

    <button onClick={submit} disabled={!canSave} style={{ width:"100%", marginTop:6, padding:13, borderRadius:14, border:"none",
      background: canSave ? "linear-gradient(135deg,"+T.flame+","+T.sunset+")" : T.slate, color:T.white, fontSize:14, fontWeight:600,
      cursor: canSave ? "pointer" : "not-allowed", opacity: canSave ? 1 : 0.6 }}>
      {saving ? "Creating…" : "Create Trip"}
    </button>
  </div>;
}
