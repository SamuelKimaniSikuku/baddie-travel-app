import { useState } from "react";
import { T } from "../theme";
import { nameIssue } from "../lib/moderation";

var AVATARS = ["😎","🧕","👨🏾","👩🏻","👨🏽","👩🏽","🧑🏻","👩🏾","🧔","👱","🧑‍🦱","🧑‍🦰","🏄","🧗","🤿","🧘"];
var VIBES = ["Adventurous","Cultural","Creative","Extreme","Social","Relaxed","Spontaneous","Luxury"];
var BUDGETS = ["Budget","Mid-range","Flexible","Luxury"];
var ALL_INTERESTS = ["Hiking","Food","Photography","Yoga","Music","Art","Nightlife","History","Beaches","Mountains","Camping","Surfing","Diving","Architecture","Markets","Coffee","Motorbikes","Wildlife","Sailing","Trekking"];

export default function EditProfileScreen({ userProfile, onSave, onBack }) {
  var [name, setName] = useState(userProfile?.name || "");
  var [bio, setBio] = useState(userProfile?.bio || "");
  var [city, setCity] = useState(userProfile?.city || "");
  var [avatar, setAvatar] = useState(userProfile?.avatar || "😎");
  var [vibe, setVibe] = useState(userProfile?.vibe || "Adventurous");
  var [budget, setBudget] = useState(userProfile?.budget || "Mid-range");
  var [interests, setInterests] = useState(userProfile?.interests || []);
  var [destination, setDestination] = useState(userProfile?.destination || "");
  var [dates, setDates] = useState(userProfile?.dates || "");
  var [saved, setSaved] = useState(false);
  var [nameErr, setNameErr] = useState("");

  function toggleInterest(interest) {
    setInterests(function(prev) {
      return prev.includes(interest) ? prev.filter(function(i){ return i !== interest; }) : prev.concat([interest]);
    });
  }

  function save() {
    var issue = nameIssue(name);
    if (issue) { setNameErr(issue); return; }
    setNameErr("");
    var updated = { name, bio, city, avatar, vibe, budget, interests, destination, dates };
    onSave(updated);
    setSaved(true);
    setTimeout(function(){ setSaved(false); onBack(updated); }, 1000);
  }

  var inputSt = { width:"100%", padding:"12px 14px", borderRadius:12, border:"1px solid "+T.glassBorder,
    background:T.glass, color:T.white, fontSize:13, outline:"none", marginBottom:10 };
  var labelSt = { fontSize:10, color:T.ash, textTransform:"uppercase", letterSpacing:2, marginBottom:7, display:"block" };

  return <div className="app-overlay" style={{ zIndex:60, background:T.midnight, animation:"fadeIn 0.2s ease" }}>
   <div className="app-panel" style={{ background:T.midnight, animation:"slideInR 0.25s ease" }}>
    {/* Header */}
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px 10px",
      borderBottom:"1px solid "+T.glass, flexShrink:0 }}>
      <button onClick={function(){ onBack(null); }} style={{ background:"none", border:"none", color:T.mist, fontSize:20, cursor:"pointer" }}>←</button>
      <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700 }}>Edit Profile</h2>
      <button onClick={save} style={{ padding:"7px 18px", borderRadius:20, border:"none",
        background: saved ? T.mint : "linear-gradient(135deg,"+T.flame+","+T.sunset+")",
        color:T.white, fontSize:12, fontWeight:600, cursor:"pointer", transition:"background 0.3s" }}>
        {saved ? "Saved ✓" : "Save"}
      </button>
    </div>

    <div style={{ flex:1, overflow:"auto", padding:"16px 16px 32px" }}>
      {/* Avatar picker */}
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ width:80, height:80, borderRadius:"50%", border:"3px solid "+T.flame, background:T.charcoal,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:38, margin:"0 auto 14px" }}>{avatar}</div>
        <span style={labelSt}>Choose your avatar</span>
        <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:8 }}>
          {AVATARS.map(function(a){
            return <button key={a} onClick={function(){ setAvatar(a); }} style={{
              width:44, height:44, borderRadius:"50%", border: avatar===a ? "2px solid "+T.flame : "2px solid transparent",
              background: avatar===a ? T.flame+"22" : T.glass, fontSize:22, cursor:"pointer",
              transition:"all 0.15s" }}>{a}</button>;
          })}
        </div>
      </div>

      <div className="edit-grid">
       {/* Left column — the basics */}
       <div>
        <span style={labelSt}>Your name</span>
        <input value={name} onChange={function(e){setName(e.target.value); if(nameErr) setNameErr("");}} placeholder="Your name"
          style={{...inputSt, borderColor: nameErr ? T.rose : T.glassBorder}} />
        {nameErr && <p style={{ color:T.rose, fontSize:11, marginTop:-4, marginBottom:10 }}>⚠️ {nameErr}</p>}

        <span style={labelSt}>Your city</span>
        <input value={city} onChange={function(e){setCity(e.target.value)}} placeholder="Where are you based?" style={inputSt} />

        <span style={labelSt}>Bio</span>
        <textarea value={bio} onChange={function(e){setBio(e.target.value)}} placeholder="Tell other travelers about yourself..."
          rows={3} style={{...inputSt, resize:"none", lineHeight:1.5}} />

        <span style={labelSt}>Next destination</span>
        <input value={destination} onChange={function(e){setDestination(e.target.value)}} placeholder="e.g. Bali, Tokyo, Morocco" style={inputSt} />

        <span style={labelSt}>Travel dates</span>
        <input value={dates} onChange={function(e){setDates(e.target.value)}} placeholder="e.g. Mar 15 – Apr 2" style={inputSt} />
       </div>

       {/* Right column — preferences */}
       <div>
        <span style={labelSt}>Travel vibe</span>
        <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:16 }}>
          {VIBES.map(function(v){
            return <button key={v} onClick={function(){ setVibe(v); }} style={{
              padding:"7px 14px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:500,
              background: vibe===v ? "linear-gradient(135deg,"+T.flame+","+T.sunset+")" : T.glass,
              color: vibe===v ? T.white : T.mist,
              border: vibe===v ? "none" : "1px solid "+T.glassBorder,
              transition:"all 0.15s" }}>{v}</button>;
          })}
        </div>

        <span style={labelSt}>Budget</span>
        <div style={{ display:"flex", gap:7, marginBottom:16, flexWrap:"wrap" }}>
          {BUDGETS.map(function(b){
            return <button key={b} onClick={function(){ setBudget(b); }} style={{
              flex:"1 1 40%", padding:"9px 4px", borderRadius:12, cursor:"pointer", fontSize:11, fontWeight:500,
              background: budget===b ? "linear-gradient(135deg,"+T.gold+"cc,"+T.sunset+"cc)" : T.glass,
              color: budget===b ? T.midnight : T.mist,
              border: budget===b ? "none" : "1px solid "+T.glassBorder,
              transition:"all 0.15s" }}>{b}</button>;
          })}
        </div>

        <span style={labelSt}>Interests ({interests.length} selected)</span>
        <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:16 }}>
          {ALL_INTERESTS.map(function(interest){
            var on = interests.includes(interest);
            return <button key={interest} onClick={function(){ toggleInterest(interest); }} style={{
              padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:11, fontWeight:500,
              background: on ? T.electric+"33" : T.glass,
              color: on ? T.violet : T.mist,
              border: on ? "1px solid "+T.violet+"66" : "1px solid "+T.glassBorder,
              transition:"all 0.15s" }}>{interest}</button>;
          })}
        </div>
       </div>
      </div>

      {/* Save button */}
      <button onClick={save} style={{ width:"100%", padding:"14px", borderRadius:14, border:"none",
        background: saved ? "linear-gradient(135deg,"+T.mint+","+T.lime+")" : "linear-gradient(135deg,"+T.flame+","+T.sunset+")",
        color: saved ? T.midnight : T.white, fontSize:14, fontWeight:600, cursor:"pointer",
        boxShadow:"0 4px 24px "+T.flame+"44", transition:"all 0.3s", marginTop:8 }}>
        {saved ? "✓ Profile Saved!" : "Save Profile ✈️"}
      </button>
    </div>
   </div>
  </div>;
}
