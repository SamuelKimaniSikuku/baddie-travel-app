import { useState, useEffect, useRef } from "react";
import { T } from "../theme";
import { tripsService } from "../services/trips";
import { isDemo } from "../lib/supabase";

// ══════════════════════════════════════════════════════════════
// NotificationCenter — a bell + dropdown of trip reminders.
// Reminders are derived client-side from the user's upcoming trips
// (no backend job needed). Read + dismissed state persists in
// localStorage so the badge and list behave across sessions.
// ══════════════════════════════════════════════════════════════

function startOfToday() { var d = new Date(); d.setHours(0,0,0,0); return d; }

function daysAway(dateStr) {
  if (!dateStr) return null;
  var d = new Date(dateStr + "T00:00:00");
  return Math.round((d - startOfToday()) / 86400000);
}

// Turn a list of trips into reminder objects. Stable ids so read/dismiss
// state sticks while the body text refreshes as the date approaches.
function buildReminders(trips) {
  var out = [];
  (trips || []).forEach(function(trip){
    if (!trip.start_date) return;
    var d = daysAway(trip.start_date);
    var endD = trip.end_date ? daysAway(trip.end_date) : d;
    var emoji = trip.destination_emoji || "🌍";
    var dest = trip.destination || "Your trip";
    if (d === 0) {
      out.push({ id:"trip-"+trip.id+"-today", tripId:trip.id, icon:emoji,
        title: dest + " starts today! 🎉", body:"Have an amazing trip.", severity:"high", sort:0 });
    } else if (d > 0 && d <= 30) {
      out.push({ id:"trip-"+trip.id+"-countdown", tripId:trip.id, icon:emoji,
        title: dest + (d === 1 ? " is tomorrow!" : " in " + d + " days"),
        body: d <= 7 ? "Time to finalize plans — check your flights and checklist." : "Coming up soon. Start planning!",
        severity: d <= 1 ? "high" : d <= 7 ? "medium" : "low", sort:d });
    } else if (d < 0 && endD >= 0) {
      out.push({ id:"trip-"+trip.id+"-ongoing", tripId:trip.id, icon:emoji,
        title: "Enjoying " + dest + "?", body:"Your trip is underway.", severity:"low", sort:-1 });
    }
  });
  out.sort(function(a,b){ return a.sort - b.sort; });
  return out;
}

// A couple of sample reminders so the feature is visible in demo mode.
function demoReminders() {
  return [
    { id:"demo-1", tripId:"t1", icon:"🏝️", title:"Bali in 5 days", body:"Time to finalize plans — check your flights and checklist.", severity:"medium", sort:5 },
    { id:"demo-2", tripId:"t1", icon:"🎒", title:"Pack your essentials", body:"Your packing checklist has open items.", severity:"low", sort:9 },
  ];
}

function loadSet(key) {
  try { var raw = localStorage.getItem(key); return new Set(raw ? JSON.parse(raw) : []); }
  catch (e) { return new Set(); }
}
function saveSet(key, set) {
  try { localStorage.setItem(key, JSON.stringify(Array.from(set))); } catch (e) {}
}

export function useTripReminders(userId) {
  var [reminders, setReminders] = useState([]);
  var readKey = "baddie_reminders_read_" + (userId || "demo");
  var hiddenKey = "baddie_reminders_hidden_" + (userId || "demo");
  var [readSet, setReadSet] = useState(function(){ return loadSet(readKey); });
  var [hiddenSet, setHiddenSet] = useState(function(){ return loadSet(hiddenKey); });

  useEffect(function(){
    var active = true;
    if (isDemo || !userId) { setReminders(demoReminders()); return; }
    tripsService.getTrips(userId).then(function(res){
      if (!active) return;
      setReminders(buildReminders(res.data || []));
    });
    return function(){ active = false; };
  }, [userId]);

  var visible = reminders.filter(function(r){ return !hiddenSet.has(r.id); });
  var unreadCount = visible.filter(function(r){ return !readSet.has(r.id); }).length;

  function markAllRead() {
    var next = new Set(readSet);
    visible.forEach(function(r){ next.add(r.id); });
    setReadSet(next); saveSet(readKey, next);
  }
  function dismiss(id) {
    var next = new Set(hiddenSet); next.add(id);
    setHiddenSet(next); saveSet(hiddenKey, next);
  }

  return { reminders: visible, unreadCount, markAllRead, dismiss };
}

var SEV_COLOR = { high: "#FF4136", medium: "#FFB830", low: "#38BDF8" };

export default function NotificationCenter({ userId, onNavigateTrips }) {
  var { reminders, unreadCount, markAllRead, dismiss } = useTripReminders(userId);
  var [open, setOpen] = useState(false);
  var ref = useRef(null);

  useEffect(function(){
    function onDoc(e){ if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return function(){ document.removeEventListener("mousedown", onDoc); };
  }, []);

  function toggle() {
    var next = !open;
    setOpen(next);
    if (next && unreadCount > 0) markAllRead();
  }

  return <div ref={ref} style={{ position:"relative" }}>
    <button onClick={toggle} aria-label="Notifications" style={{ position:"relative", width:32, height:32, borderRadius:"50%",
      background:T.charcoal, border:"2px solid "+T.slate, display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:15, cursor:"pointer", color:T.mist }}>
      🔔
      {unreadCount > 0 && <span style={{ position:"absolute", top:-4, right:-4, minWidth:16, height:16, padding:"0 4px",
        borderRadius:8, background:T.flame, color:T.white, fontSize:9, fontWeight:700, display:"flex", alignItems:"center",
        justifyContent:"center", border:"2px solid "+T.midnight }}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
    </button>

    {open && <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:290, zIndex:90,
      background:T.ink, border:"1px solid "+T.glassBorder, borderRadius:16, boxShadow:"0 16px 40px rgba(0,0,0,0.55)",
      overflow:"hidden", animation:"fadeInUp 0.2s ease" }}>
      <div style={{ padding:"12px 14px", borderBottom:"1px solid "+T.glassBorder, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:700 }}>Notifications</span>
        <span style={{ fontSize:10, color:T.ash }}>{reminders.length} reminder{reminders.length===1?"":"s"}</span>
      </div>
      <div style={{ maxHeight:340, overflowY:"auto" }}>
        {reminders.length === 0 ? <div style={{ padding:"28px 14px", textAlign:"center" }}>
          <div style={{ fontSize:26, marginBottom:6 }}>🎉</div>
          <p style={{ fontSize:12, color:T.ash }}>You're all caught up!</p>
        </div> : reminders.map(function(r){
          return <div key={r.id} style={{ display:"flex", gap:10, padding:"11px 13px", borderBottom:"1px solid "+T.glass, alignItems:"flex-start" }}>
            <div style={{ width:34, height:34, borderRadius:10, background:(SEV_COLOR[r.severity]||T.sky)+"1e",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>{r.icon}</div>
            <div onClick={function(){ setOpen(false); if (onNavigateTrips) onNavigateTrips(r.tripId); }} style={{ flex:1, minWidth:0, cursor:"pointer" }}>
              <p style={{ fontSize:12.5, fontWeight:600, lineHeight:1.35 }}>{r.title}</p>
              {r.body && <p style={{ fontSize:10.5, color:T.mist, marginTop:2, lineHeight:1.4 }}>{r.body}</p>}
            </div>
            <button onClick={function(){ dismiss(r.id); }} aria-label="Dismiss" style={{ background:"none", border:"none",
              color:T.ash, fontSize:14, cursor:"pointer", lineHeight:1, padding:2, flexShrink:0 }}>✕</button>
          </div>;
        })}
      </div>
    </div>}
  </div>;
}
