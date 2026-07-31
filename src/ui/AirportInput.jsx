import { useState, useRef, useEffect } from "react";
import { T } from "../theme";
import { searchAirports, airportByCode } from "../data/airports";

// ══════════════════════════════════════════════════════════════
// AirportInput — type a city / airport / country, pick from a
// dropdown, and the selected IATA code is reported via onSelect.
// `value` is the current IATA code (or ""). Controlled from parent.
// ══════════════════════════════════════════════════════════════
export default function AirportInput({ value, onSelect, placeholder }) {
  var [query, setQuery] = useState("");
  var [open, setOpen] = useState(false);
  var [highlight, setHighlight] = useState(0);
  var boxRef = useRef(null);

  // Keep the visible text in sync when a code is set from outside
  // (e.g. cleared or preset) and the field isn't being edited.
  useEffect(function(){
    if (open) return;
    var a = airportByCode(value);
    setQuery(a ? a.city + " (" + a.code + ")" : (value || ""));
  }, [value, open]);

  // Close on outside click.
  useEffect(function(){
    function onDoc(e){ if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return function(){ document.removeEventListener("mousedown", onDoc); };
  }, []);

  var matches = open ? searchAirports(query, 6) : [];

  function choose(a) {
    onSelect(a.code);
    setQuery(a.city + " (" + a.code + ")");
    setOpen(false);
  }

  function onChange(e) {
    setQuery(e.target.value);
    setOpen(true);
    setHighlight(0);
    // If they clear the field, clear the selection too.
    if (!e.target.value.trim()) onSelect("");
  }

  function onKeyDown(e) {
    if (!open || matches.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight(function(h){ return Math.min(h + 1, matches.length - 1); }); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight(function(h){ return Math.max(h - 1, 0); }); }
    else if (e.key === "Enter") { e.preventDefault(); choose(matches[highlight]); }
    else if (e.key === "Escape") { setOpen(false); }
  }

  var inp = { width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid "+T.glassBorder, background:T.glass, color:T.white, fontSize:12, outline:"none", boxSizing:"border-box" };

  return <div ref={boxRef} style={{ position:"relative", flex:1 }}>
    <input
      style={inp}
      placeholder={placeholder || "City or airport"}
      value={query}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onFocus={function(){ setOpen(true); }}
      autoComplete="off"
    />
    {open && matches.length > 0 && <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:20,
      background:T.charcoal, border:"1px solid "+T.glassBorder, borderRadius:12, overflow:"hidden", boxShadow:"0 10px 30px rgba(0,0,0,0.5)", maxHeight:220, overflowY:"auto" }}>
      {matches.map(function(a, i){
        var active = i === highlight;
        return <div key={a.code}
          onMouseDown={function(e){ e.preventDefault(); choose(a); }}
          onMouseEnter={function(){ setHighlight(i); }}
          style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 11px", cursor:"pointer",
            background: active ? T.flame+"1c" : "transparent" }}>
          <span style={{ fontSize:11, fontWeight:700, color:T.sky, minWidth:30 }}>{a.code}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.city}</div>
            <div style={{ fontSize:9, color:T.ash, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.name} · {a.country}</div>
          </div>
        </div>;
      })}
    </div>}
  </div>;
}
