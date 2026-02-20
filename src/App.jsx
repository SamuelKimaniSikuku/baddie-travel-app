import { useState, useEffect, useRef, useCallback } from "react";

var isDemo = true;

var TRAVELERS = [
  { id:"d1", name:"Sofia", age:26, avatar:"\ud83e\uddd5", verified:true, city:"Barcelona", destination:"Bali", destEmoji:"\ud83c\udf34", dates:"Mar 15 - Apr 2", bio:"Yoga retreats, sunrise hikes, and street food adventures. Looking for a chill travel buddy!", vibe:"Adventurous", budget:"Mid-range", interests:["Yoga","Hiking","Food","Photography"], languages:["English","Spanish"], tripCount:7, rating:4.8, color:"#FF6B35", online:true, lastSeen:"now", stories:[{text:"Just booked my Bali flight!",bg:"#FF6B35"},{text:"Anyone tried Ubud rice terraces?",bg:"#1B998B"}] },
  { id:"d2", name:"Marcus", age:29, avatar:"\ud83d\udc68\ud83c\udffe", verified:true, city:"London", destination:"Tokyo", destEmoji:"\ud83d\uddfc", dates:"Apr 5 - Apr 20", bio:"Anime nerd meets foodie. Every ramen shop and arcade in Akihabara is calling my name.", vibe:"Cultural", budget:"Flexible", interests:["Food","Nightlife","Gaming","Anime"], languages:["English","Japanese"], tripCount:12, rating:4.9, color:"#7B2D8E", online:true, lastSeen:"now", stories:[{text:"Tokyo ramen research begins",bg:"#7B2D8E"}] },
  { id:"d3", name:"Ayla", age:24, avatar:"\ud83d\udc69\ud83c\udffb", verified:false, city:"Istanbul", destination:"Morocco", destEmoji:"\ud83d\udd4c", dates:"May 1 - May 14", bio:"Photographer chasing golden hour. Lets get lost in the medinas and find the best mint tea.", vibe:"Creative", budget:"Budget", interests:["Photography","Art","Tea","Markets"], languages:["English","Turkish","Arabic"], tripCount:5, rating:4.7, color:"#E8475F", online:false, lastSeen:"2h ago", stories:[] },
  { id:"d4", name:"Kai", age:31, avatar:"\ud83d\udc68\ud83c\udffd", verified:true, city:"Auckland", destination:"Patagonia", destEmoji:"\ud83c\udfd4\ufe0f", dates:"Jun 10 - Jul 1", bio:"Mountaineer and trail runner. Planning the W Trek and need a solid hiking partner.", vibe:"Extreme", budget:"Mid-range", interests:["Trekking","Camping","Wildlife","Running"], languages:["English","Maori"], tripCount:15, rating:5.0, color:"#1B998B", online:true, lastSeen:"now", stories:[{text:"Training for Patagonia!",bg:"#1B998B"}] },
  { id:"d5", name:"Priya", age:27, avatar:"\ud83d\udc69\ud83c\udffd", verified:true, city:"Mumbai", destination:"Greece", destEmoji:"\ud83c\uddec\ud83c\uddf7", dates:"Jul 5 - Jul 18", bio:"Island hopping, sunset cocktails, and ancient ruins. Group trips welcome!", vibe:"Social", budget:"Luxury", interests:["Islands","History","Parties","Diving"], languages:["English","Hindi","French"], tripCount:9, rating:4.6, color:"#F4A261", online:false, lastSeen:"30m ago", stories:[] },
  { id:"d6", name:"Liam", age:28, avatar:"\ud83e\uddd1\ud83c\udffc", verified:true, city:"Dublin", destination:"Vietnam", destEmoji:"\ud83c\uddfb\ud83c\uddf3", dates:"Aug 1 - Aug 21", bio:"Motorbike through the mountains, eat pho for breakfast, float in Ha Long Bay.", vibe:"Adventurous", budget:"Budget", interests:["Food","Hiking","Motorcycles","Photography"], languages:["English","Irish"], tripCount:11, rating:4.8, color:"#4A6CF7", online:true, lastSeen:"now", stories:[{text:"Vietnam visa approved!",bg:"#4A6CF7"}] },
  { id:"d7", name:"Zara", age:25, avatar:"\ud83e\uddd1\u200d\ud83c\udfa4", verified:false, city:"Berlin", destination:"Colombia", destEmoji:"\ud83c\udde8\ud83c\uddf4", dates:"Sep 10 - Sep 28", bio:"Salsa dancing, coffee farms, and Caribbean coastlines. Can you keep up?", vibe:"Social", budget:"Mid-range", interests:["Dancing","Coffee","Beach","Nightlife"], languages:["English","German","Spanish"], tripCount:6, rating:4.5, color:"#D946EF", online:true, lastSeen:"now", stories:[] }
];

var REPLIES = ["That sounds amazing!","Im so down!","Checking flights now","Found a great spot!","Whats your budget?","Let me send you the itinerary","Have you gotten your visa yet?","The food there is incredible","Cant wait! This trip will be epic","Lets split an Airbnb!","Just booked my hostel!","We should make a group chat!"];

var T = { flame:"#FF5733",coral:"#FF8066",sunset:"#FF6B4A",midnight:"#0D0D1A",ink:"#1A1A2E",slate:"#3D3D56",ash:"#8888A0",mist:"#C5C5D3",cloud:"#EEEEF4",snow:"#F7F7FB",white:"#FFFFFF",mint:"#00D9A6",electric:"#4A6CF7",gold:"#FFB830",rose:"#FF4D6A" };

function calcCompat(me, them) {
  var s = 50;
  if (me.vibe === them.vibe) s += 20;
  if (me.budget === them.budget) s += 10;
  s += (me.interests || []).filter(function(i) { return (them.interests || []).includes(i); }).length * 8;
  return Math.min(s, 99);
}

export default function App() {
  var _a = useState("discover"); var screen = _a[0]; var setScreen = _a[1];
  var _b = useState(0); var cardIdx = _b[0]; var setCardIdx = _b[1];
  var _c = useState([TRAVELERS[0], TRAVELERS[1]]); var matches = _c[0]; var setMatches = _c[1];
  var _d = useState([]); var chats = _d[0]; var setChats = _d[1];
  var _e = useState(null); var activeChat = _e[0]; var setActiveChat = _e[1];
  var _f = useState(""); var msgText = _f[0]; var setMsgText = _f[1];
  var _g = useState(null); var showMatch = _g[0]; var setShowMatch = _g[1];
  var _h = useState(null); var showStory = _h[0]; var setShowStory = _h[1];
  var _i = useState(0); var dragX = _i[0]; var setDragX = _i[1];
  var _j = useState(false); var isDragging = _j[0]; var setIsDragging = _j[1];
  var _k = useState(false); var typing = _k[0]; var setTyping = _k[1];
  var _l = useState([]); var confettiArr = _l[0]; var setConfettiArr = _l[1];
  var _m = useState(null); var toast = _m[0]; var setToast = _m[1];
  var startX = useRef(0);
  var msgEnd = useRef(null);
  var user = { avatar:"\ud83d\ude0e", name:"You", vibe:"Adventurous", budget:"Mid-range", interests:["Hiking","Food","Photography"] };

  useEffect(function() {
    setChats([
      { id:"c1", traveler:TRAVELERS[0], unread:2, time:"2m", messages:[
        {from:"system",text:"You matched with Sofia! Both heading to Bali",time:"Yesterday"},
        {from:"them",text:"Hey! Saw youre heading to Bali too",time:"10:30"},
        {from:"me",text:"Yes!! So excited. Have you been before?",time:"10:32",read:true},
        {from:"them",text:"First time! Planning to hit Ubud for a week",time:"10:33"},
        {from:"me",text:"Same! We should check out the rice terraces",time:"10:35",read:true},
        {from:"them",text:"Omg yes! The rice terraces are a must",time:"10:36"}
      ]},
      { id:"c2", traveler:TRAVELERS[1], unread:0, time:"1h", messages:[
        {from:"system",text:"You matched with Marcus! Both heading to Tokyo",time:"Tuesday"},
        {from:"them",text:"Yo! Fellow Tokyo traveler!",time:"9:00"},
        {from:"me",text:"Heyy! When are you going?",time:"9:05",read:true},
        {from:"them",text:"April 5th! You?",time:"9:06"},
        {from:"me",text:"April 8th! We overlap. Must-visit spots?",time:"9:10",read:true},
        {from:"them",text:"I know the BEST ramen spot in Shinjuku",time:"9:12"}
      ]}
    ]);
    setCardIdx(2);
  }, []);

  useEffect(function() {
    if (msgEnd.current) msgEnd.current.scrollIntoView({behavior:"smooth"});
  }, [activeChat, chats, typing]);

  function showToastMsg(m) { setToast(m); setTimeout(function(){setToast(null);}, 2500); }

  var swipe = useCallback(function(dir) {
    var traveler = TRAVELERS[cardIdx];
    if (!traveler) return;
    if (dir === "right") {
      setMatches(function(p){return p.concat([traveler]);});
      setShowMatch(traveler);
      var arr = [];
      for (var i=0;i<20;i++) arr.push({id:i,emoji:["*","~","+","!"][i%4],x:Math.random()*100,delay:Math.random()*2,dur:2+Math.random()*2});
      setConfettiArr(arr);
      setChats(function(p){return [{id:"c"+traveler.id,traveler:traveler,unread:1,time:"Now",messages:[{from:"system",text:"You matched with "+traveler.name+"! Both heading to "+traveler.destination,time:"Now"}]}].concat(p);});
    }
    setCardIdx(function(p){return p+1;});
    setDragX(0);
  }, [cardIdx]);

  function send() {
    if (!msgText.trim() || !activeChat) return;
    var d = new Date();
    var time = String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
    var msg = {from:"me",text:msgText,time:time,read:false};
    var cid = activeChat.id;
    setChats(function(p){return p.map(function(c){return c.id===cid?Object.assign({},c,{messages:c.messages.concat([msg]),time:"Now"}):c;});});
    setActiveChat(function(p){return p?Object.assign({},p,{messages:p.messages.concat([msg])}):p;});
    setMsgText("");
    setTimeout(function(){
      setTyping(true);
      setTimeout(function(){
        setTyping(false);
        var reply = REPLIES[Math.floor(Math.random()*REPLIES.length)];
        var d2 = new Date();
        var rt = String(d2.getHours()).padStart(2,"0")+":"+String(d2.getMinutes()).padStart(2,"0");
        var rm = {from:"them",text:reply,time:rt};
        setChats(function(p){return p.map(function(c){return c.id===cid?Object.assign({},c,{messages:c.messages.concat([rm]),time:"Now"}):c;});});
        setActiveChat(function(p){return p?Object.assign({},p,{messages:p.messages.concat([rm])}):p;});
      }, 1500);
    }, 500);
  }

  function openChat(chat) { chat.unread=0; setActiveChat(chat); }
  function lastMsg(c) { return c.messages.length>0?c.messages[c.messages.length-1].text:""; }
  var totalUnread = chats.reduce(function(a,c){return a+c.unread;},0);
  var t = TRAVELERS[cardIdx];
  var compat = t ? calcCompat(user,t) : 0;

  var css = "@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}@keyframes fly{0%,100%{transform:translateX(0) rotate(25deg)}50%{transform:translateX(8px) rotate(25deg)}}@keyframes typingBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@keyframes confetti{0%{transform:translateY(-10px) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}@keyframes ringPulse{0%{box-shadow:0 0 0 0 rgba(255,87,51,0.4)}100%{box-shadow:0 0 0 6px rgba(255,87,51,0)}}*{margin:0;padding:0;box-sizing:border-box;}";

  return (
    <div>
      <style>{css}</style>
      <div style={{fontFamily:"Outfit,sans-serif",width:"100%",maxWidth:430,height:"100vh",maxHeight:932,margin:"0 auto",background:T.snow,position:"relative",overflow:"hidden",display:"flex",flexDirection:"column"}}>

        {toast && <div style={{position:"absolute",top:16,left:"50%",transform:"translateX(-50%)",zIndex:9000,padding:"10px 24px",borderRadius:30,background:T.ink,color:"#fff",fontSize:14,fontWeight:600,animation:"slideUp 0.3s ease"}}>{toast}</div>}

        {showStory && (function(){
          var sv = showStory;
          return <div style={{position:"fixed",inset:0,zIndex:9999,background:sv.stories[0]?sv.stories[0].bg:"#333",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={function(){setShowStory(null);}}>
            <div style={{color:"#fff",textAlign:"center",padding:40}}>
              <div style={{fontSize:48,marginBottom:16}}>{sv.avatar}</div>
              <div style={{fontSize:20,fontWeight:700,marginBottom:8}}>{sv.name}</div>
              <div style={{fontSize:24,fontWeight:700}}>{sv.stories[0]?sv.stories[0].text:""}</div>
              <div style={{marginTop:20,fontSize:14,opacity:0.6}}>Tap to close</div>
            </div>
          </div>;
        })()}

        {showMatch && <div style={{position:"absolute",inset:0,zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn 0.4s ease"}}>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(155deg,"+T.flame+","+T.rose+",#B91D73)"}} />
          {confettiArr.map(function(c){return <div key={c.id} style={{position:"absolute",fontSize:20,left:c.x+"%",top:-20,animation:"confetti "+c.dur+"s linear "+c.delay+"s forwards"}}>{c.emoji}</div>;})}
          <div style={{position:"relative",zIndex:1,textAlign:"center",color:"#fff",padding:32}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
              <div style={{width:72,height:72,borderRadius:"50%",border:"3px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,background:"rgba(255,255,255,0.15)"}}>{user.avatar}</div>
              <div style={{width:72,height:72,borderRadius:"50%",border:"3px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,background:"rgba(255,255,255,0.15)",marginLeft:-12}}>{showMatch.avatar}</div>
            </div>
            <div style={{fontFamily:"Playfair Display,serif",fontSize:38,fontWeight:700,fontStyle:"italic",margin:"8px 0"}}>Its a Trip!</div>
            <p style={{fontSize:16,opacity:0.9}}>You and {showMatch.name} are heading to</p>
            <p style={{fontSize:28,fontWeight:800,margin:"4px 0 24px"}}>{showMatch.destination} {showMatch.destEmoji}</p>
            <button onClick={function(){setShowMatch(null);var ch=chats.find(function(c){return c.traveler.id===showMatch.id;});if(ch)openChat(ch);setScreen("chats");}} style={{padding:"14px 36px",borderRadius:30,border:"none",background:"#fff",color:T.flame,fontFamily:"Outfit",fontSize:16,fontWeight:700,cursor:"pointer"}}>Send a message</button>
            <br/><button onClick={function(){setShowMatch(null);}} style={{marginTop:12,background:"none",border:"none",color:"#fff",opacity:0.7,cursor:"pointer",fontFamily:"Outfit",fontSize:13}}>Keep swiping</button>
          </div>
        </div>}

        {activeChat && <div style={{position:"absolute",inset:0,zIndex:500,background:T.snow,display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:T.white,borderBottom:"1px solid "+T.cloud}}>
            <button onClick={function(){setActiveChat(null);}} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:T.flame}}>&#8592;</button>
            <div style={{width:40,height:40,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,background:T.cloud}}>{activeChat.traveler.avatar}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:700,color:T.ink}}>{activeChat.traveler.name}</div>
              <div style={{fontSize:11,color:activeChat.traveler.online?T.mint:T.ash}}>{activeChat.traveler.online?"online":"last seen "+activeChat.traveler.lastSeen}</div>
            </div>
          </div>
          <div style={{flex:1,overflow:"auto",padding:16,display:"flex",flexDirection:"column",gap:4}}>
            <div style={{alignSelf:"center",textAlign:"center",padding:"14px 24px",background:"linear-gradient(135deg,#FFF5F0,#FFF0EC)",borderRadius:16,border:"1px solid #FFE0D0",marginBottom:8}}>
              <div style={{fontSize:32}}>{activeChat.traveler.destEmoji}</div>
              <div style={{fontSize:15,fontWeight:700,color:T.flame}}>{activeChat.traveler.destination}</div>
              <div style={{fontSize:12,color:T.ash}}>{activeChat.traveler.dates}</div>
            </div>
            {activeChat.messages.map(function(m,i){
              var isMe = m.from==="me";
              var isSys = m.from==="system";
              return <div key={i} style={{display:"flex",justifyContent:isMe?"flex-end":isSys?"center":"flex-start",marginBottom:2}}>
                <div style={Object.assign({maxWidth:"78%",padding:"10px 14px",fontSize:15,lineHeight:1.45},isMe?{background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")",color:"#fff",borderRadius:"18px 18px 4px 18px"}:isSys?{background:T.cloud,color:T.ash,fontSize:13,borderRadius:12}:{background:T.white,color:T.ink,borderRadius:"18px 18px 18px 4px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"})}>
                  {m.text}
                  <div style={{fontSize:10,opacity:0.6,marginTop:3}}>{m.time}</div>
                </div>
              </div>;
            })}
            {typing && <div style={{display:"flex"}}><div style={{display:"flex",gap:4,padding:"12px 16px",background:T.white,borderRadius:18}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:T.mist,animation:"typingBounce 1s ease 0s infinite"}} />
              <div style={{width:8,height:8,borderRadius:"50%",background:T.mist,animation:"typingBounce 1s ease 0.15s infinite"}} />
              <div style={{width:8,height:8,borderRadius:"50%",background:T.mist,animation:"typingBounce 1s ease 0.3s infinite"}} />
            </div></div>}
            <div ref={msgEnd} />
          </div>
          <div style={{display:"flex",gap:8,padding:"8px 14px 20px",background:T.white,borderTop:"1px solid "+T.cloud}}>
            <input value={msgText} onChange={function(e){setMsgText(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")send();}} placeholder="Plan your trip..." style={{flex:1,padding:"10px 16px",border:"1.5px solid "+T.cloud,borderRadius:24,fontFamily:"Outfit",fontSize:15,color:T.ink,outline:"none",background:T.snow}} />
            <button onClick={send} style={{width:42,height:42,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,"+T.flame+","+T.sunset+")",color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>&#10148;</button>
          </div>
        </div>}

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",background:T.white,borderBottom:"1px solid "+T.cloud,zIndex:10}}>
          <div style={{fontSize:26,fontWeight:900,letterSpacing:-1}}>b<span style={{color:T.flame}}>a</span>ddie</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {isDemo && <span style={{padding:"4px 10px",borderRadius:8,background:T.gold+"20",color:T.gold,fontSize:11,fontWeight:700}}>DEMO</span>}
            <div style={{width:38,height:38,borderRadius:12,background:T.snow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,position:"relative",cursor:"pointer"}} onClick={function(){showToastMsg("No new notifications");}}>
              &#128276;
              {totalUnread>0 && <span style={{position:"absolute",top:-2,right:-2,width:18,height:18,background:T.rose,borderRadius:"50%",color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{totalUnread}</span>}
            </div>
          </div>
        </div>

        {/* Screens */}
        <div style={{flex:1,overflow:"hidden",position:"relative"}}>

          {/* DISCOVER */}
          <div style={{position:"absolute",inset:0,overflow:"auto",opacity:screen==="discover"?1:0,pointerEvents:screen==="discover"?"auto":"none",transition:"opacity 0.3s"}}>
            <div style={{display:"flex",gap:14,padding:"12px 20px",overflowX:"auto"}}>
              {TRAVELERS.filter(function(tr){return tr.stories&&tr.stories.length>0;}).map(function(tr){
                return <div key={tr.id} onClick={function(){setShowStory(tr);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",flexShrink:0}}>
                  <div style={{width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,"+tr.color+","+T.rose+")",padding:3,animation:"ringPulse 2s ease infinite"}}>
                    <div style={{width:"100%",height:"100%",borderRadius:"50%",background:T.white,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{tr.avatar}</div>
                  </div>
                  <span style={{fontSize:11,fontWeight:600,color:T.slate}}>{tr.name}</span>
                </div>;
              })}
            </div>

            <div style={{display:"flex",gap:8,padding:"4px 20px 12px",overflowX:"auto"}}>
              {["All","Asia","Europe","Americas","Africa"].map(function(f,i){
                return <button key={f} style={{padding:"7px 16px",borderRadius:20,border:"1.5px solid "+(i===0?T.flame:T.cloud),background:i===0?"#FFF0EC":T.white,fontFamily:"Outfit",fontSize:13,fontWeight:600,color:i===0?T.flame:T.ash,cursor:"pointer",whiteSpace:"nowrap"}}>{f}</button>;
              })}
            </div>

            <div style={{padding:"0 20px",position:"relative",height:420}}>
              {t ? <div>
                {TRAVELERS[cardIdx+1] && <div style={{position:"absolute",width:"100%",height:"100%",borderRadius:24,background:T.white,boxShadow:"0 8px 32px rgba(0,0,0,0.06)",transform:"scale(0.95) translateY(10px)",opacity:0.5}} />}
                <div
                  style={{position:"absolute",width:"100%",height:"100%",borderRadius:24,overflow:"hidden",background:T.white,boxShadow:"0 16px 48px rgba(0,0,0,0.12)",cursor:"grab",touchAction:"none",userSelect:"none",transform:"translateX("+dragX+"px) rotate("+dragX*0.05+"deg)",transition:isDragging?"none":"transform 0.3s ease"}}
                  onPointerDown={function(e){startX.current=e.clientX;setIsDragging(true);e.currentTarget.setPointerCapture(e.pointerId);}}
                  onPointerMove={function(e){if(isDragging)setDragX(e.clientX-startX.current);}}
                  onPointerUp={function(){setIsDragging(false);if(dragX>100)swipe("right");else if(dragX<-100)swipe("left");else setDragX(0);}}
                >
                  {dragX>30 && <div style={{position:"absolute",top:"40%",left:20,zIndex:20,padding:"8px 20px",borderRadius:12,fontSize:22,fontWeight:900,color:T.mint,border:"3px solid "+T.mint,transform:"rotate(-15deg)",opacity:Math.min(dragX/100,1)}}>LETS GO</div>}
                  {dragX<-30 && <div style={{position:"absolute",top:"40%",right:20,zIndex:20,padding:"8px 20px",borderRadius:12,fontSize:22,fontWeight:900,color:T.rose,border:"3px solid "+T.rose,transform:"rotate(15deg)",opacity:Math.min(-dragX/100,1)}}>NOPE</div>}
                  <div style={{height:"52%",position:"relative",background:"linear-gradient(155deg,"+t.color+"CC,"+t.color+"88,"+T.midnight+")"}}>
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:100,opacity:0.12}}>{t.destEmoji}</div>
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 30%,#0D0D1A)"}} />
                    <div style={{position:"absolute",top:16,right:16,padding:"5px 10px",borderRadius:16,background:T.mint+"18",border:"1.5px solid "+T.mint+"40",fontSize:12,fontWeight:700,color:T.mint}}>{compat}% match</div>
                    <div style={{position:"absolute",bottom:16,left:16,display:"flex",alignItems:"flex-end",gap:12}}>
                      <div style={{width:64,height:64,borderRadius:"50%",border:"3px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,background:"rgba(255,255,255,0.15)"}}>{t.avatar}</div>
                      <div>
                        <div style={{color:"#fff",fontSize:22,fontWeight:800}}>{t.name}, {t.age}</div>
                        <div style={{color:"rgba(255,255,255,0.7)",fontSize:13}}>{t.city} | {t.tripCount} trips | {t.rating} stars</div>
                      </div>
                    </div>
                  </div>
                  <div style={{padding:"14px 18px",height:"48%",display:"flex",flexDirection:"column"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"linear-gradient(135deg,#FFF5F0,#FFF0EC)",borderRadius:14,border:"1px solid #FFE0D0",marginBottom:10}}>
                      <span style={{fontSize:26}}>{t.destEmoji}</span>
                      <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700,color:T.flame}}>{t.destination}</div><div style={{fontSize:12,color:T.ash}}>{t.dates}</div></div>
                      <span style={{fontSize:24,animation:"fly 1.5s ease infinite"}}>&#9992;&#65039;</span>
                    </div>
                    <p style={{fontSize:14,color:T.slate,lineHeight:1.5,marginBottom:10,flex:1}}>{t.bio}</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      <span style={{padding:"5px 12px",borderRadius:16,background:t.color,color:"#fff",fontSize:12,fontWeight:700}}>{t.vibe}</span>
                      <span style={{padding:"5px 12px",borderRadius:16,background:T.cloud,color:T.slate,fontSize:12,fontWeight:600}}>{t.budget}</span>
                      {t.interests.slice(0,3).map(function(interest){return <span key={interest} style={{padding:"5px 12px",borderRadius:16,background:T.snow,color:T.ash,fontSize:12,border:"1px solid "+T.cloud}}>{interest}</span>;})}
                    </div>
                  </div>
                </div>
              </div> : <div style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:56}}>&#127758;</div><h3 style={{fontSize:20,fontWeight:700,color:T.ink,margin:"12px 0 4px"}}>All caught up!</h3><p style={{fontSize:14,color:T.ash}}>Check back later for new travelers</p></div>}
            </div>
            {t && <div style={{display:"flex",justifyContent:"center",gap:20,padding:"16px 0 8px"}}>
              <button onClick={function(){swipe("left");}} style={{width:52,height:52,borderRadius:"50%",border:"2px solid "+T.cloud,background:T.white,fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.rose}}>&#10005;</button>
              <button onClick={function(){showToastMsg("Super liked!");}} style={{width:44,height:44,borderRadius:"50%",border:"2px solid "+T.gold,background:T.white,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>&#11088;</button>
              <button onClick={function(){swipe("right");}} style={{width:56,height:56,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,"+T.mint+",#00C49A)",fontSize:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px "+T.mint+"40"}}>&#9992;&#65039;</button>
            </div>}
          </div>

          {/* CHATS */}
          <div style={{position:"absolute",inset:0,overflow:"auto",opacity:screen==="chats"?1:0,pointerEvents:screen==="chats"?"auto":"none",transition:"opacity 0.3s"}}>
            <div style={{padding:"20px 20px 12px"}}><div style={{fontFamily:"Playfair Display,serif",fontSize:30,fontWeight:700,color:T.ink}}>Messages</div></div>
            {chats.length===0?<div style={{textAlign:"center",padding:"60px 20px"}}><p style={{color:T.ash}}>Match with travelers to start chatting!</p></div>
            :chats.map(function(c){return <div key={c.id} onClick={function(){openChat(c);}} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",cursor:"pointer",borderBottom:"1px solid "+T.cloud+"22"}}>
              <div style={{width:54,height:54,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0,background:c.traveler.color+"12"}}>{c.traveler.avatar}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:16,fontWeight:700,color:T.ink}}>{c.traveler.name}</span><span style={{fontSize:12,color:T.ash}}>{c.time}</span></div>
                <div style={{fontSize:11,color:T.flame,fontWeight:600}}>{c.traveler.destination} {c.traveler.destEmoji}</div>
                <div style={{fontSize:14,color:T.ash,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lastMsg(c)}</div>
              </div>
              {c.unread>0 && <div style={{width:22,height:22,background:T.flame,borderRadius:"50%",color:"#fff",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{c.unread}</div>}
            </div>;})}
          </div>

          {/* TRIPS */}
          <div style={{position:"absolute",inset:0,overflow:"auto",opacity:screen==="trips"?1:0,pointerEvents:screen==="trips"?"auto":"none",transition:"opacity 0.3s",padding:20}}>
            <div style={{fontFamily:"Playfair Display,serif",fontSize:30,fontWeight:700,color:T.ink,marginBottom:16}}>My Trips</div>
            {matches.map(function(m,i){return <div key={m.id} onClick={function(){var ch=chats.find(function(c){return c.traveler.id===m.id;});if(ch){openChat(ch);setScreen("chats");}}} style={{display:"flex",alignItems:"center",gap:14,padding:16,background:T.white,borderRadius:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.04)",cursor:"pointer"}}>
              <div style={{width:56,height:56,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,background:"linear-gradient(135deg,#FFF5F0,#FFF0EC)"}}>{m.destEmoji}</div>
              <div style={{flex:1}}><div style={{fontSize:17,fontWeight:700,color:T.ink}}>{m.destination}</div><div style={{fontSize:13,color:T.ash}}>{m.dates}</div><div style={{fontSize:13,color:T.flame,fontWeight:600,marginTop:2}}>with {m.name} {m.avatar}</div></div>
              <span style={{padding:"5px 12px",borderRadius:12,fontSize:11,fontWeight:700,background:i<2?"#FFF5E0":"#E8FFF5",color:i<2?"#D4900A":"#00A86B"}}>{i<2?"PLANNING":"NEW"}</span>
            </div>;})}
          </div>

          {/* PROFILE */}
          <div style={{position:"absolute",inset:0,overflow:"auto",opacity:screen==="profile"?1:0,pointerEvents:screen==="profile"?"auto":"none",transition:"opacity 0.3s",padding:20}}>
            <div style={{background:T.white,borderRadius:24,padding:28,textAlign:"center",boxShadow:"0 8px 24px rgba(0,0,0,0.06)"}}>
              <div style={{width:90,height:90,borderRadius:"50%",margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:50,background:"linear-gradient(135deg,#FFF5F0,#FFF0EC)"}}>{user.avatar}</div>
              <div style={{fontSize:24,fontWeight:800,color:T.ink}}>{user.name}</div>
              <div style={{display:"flex",justifyContent:"center",gap:32,marginTop:20,paddingTop:20,borderTop:"1px solid "+T.cloud}}>
                <div><div style={{fontSize:22,fontWeight:800,color:T.flame}}>{matches.length}</div><div style={{fontSize:12,color:T.ash}}>Matches</div></div>
                <div><div style={{fontSize:22,fontWeight:800,color:T.electric}}>{matches.length}</div><div style={{fontSize:12,color:T.ash}}>Trips</div></div>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{display:"flex",justifyContent:"space-around",padding:"6px 0 16px",background:T.white,borderTop:"1px solid "+T.cloud}}>
          {[{id:"discover",icon:"\ud83d\udd25",label:"Discover"},{id:"chats",icon:"\ud83d\udcac",label:"Chats",badge:totalUnread},{id:"trips",icon:"\ud83d\uddfa\ufe0f",label:"Trips"},{id:"profile",icon:"\ud83d\udc64",label:"Profile"}].map(function(tab){
            return <button key={tab.id} onClick={function(){setScreen(tab.id);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"4px 16px",position:"relative"}}>
              <span style={{fontSize:22,opacity:screen===tab.id?1:0.4}}>{tab.icon}</span>
              <span style={{fontSize:11,fontWeight:600,color:screen===tab.id?T.flame:T.ash}}>{tab.label}</span>
              {tab.badge>0 && <span style={{position:"absolute",top:0,right:8,width:18,height:18,background:T.rose,borderRadius:"50%",color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{tab.badge}</span>}
            </button>;
          })}
        </div>
      </div>
    </div>
  );
}
