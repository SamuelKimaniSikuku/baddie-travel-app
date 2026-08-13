// ─── Design Tokens ───────────────────────────────────────────
export var T = {
  flame:"#FF4136", coral:"#FF6B5A", sunset:"#FF8C42", gold:"#FFB830",
  midnight:"#0A0A14", ink:"#14142B", charcoal:"#1E1E32", slate:"#2D2D48",
  ash:"#6E6E8A", mist:"#A0A0BE", cloud:"#E8E8F0", snow:"#F5F5FA",
  white:"#FFFFFF", mint:"#00D4AA", electric:"#5B5BFF", rose:"#FF3B6F",
  sky:"#38BDF8", violet:"#A78BFA", lime:"#84CC16",
  glass:"rgba(255,255,255,0.06)", glassBorder:"rgba(255,255,255,0.1)",
};

export var CATEGORY_ICONS = {
  flight:"✈️", transport:"🚕", accommodation:"🏨", food:"🍜",
  activity:"🎯", sightseeing:"📸", shopping:"🛍️", nightlife:"🌙",
  relaxation:"🧘", other:"📌", insurance:"🛡️", visa:"📄", tips:"💰",
};
export var CATEGORY_COLORS = {
  flight:T.sky, transport:T.electric, accommodation:T.violet, food:T.sunset,
  activity:T.mint, sightseeing:T.coral, shopping:T.rose, nightlife:T.violet,
  relaxation:T.mint, other:T.ash,
};

// ─── Global CSS ──────────────────────────────────────────────
export var css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Fraunces:ital,wght@0,700;0,900;1,700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
html,body,#root{height:100%;overflow:hidden;}
body{font-family:'Sora',sans-serif;background:${T.midnight};color:${T.white};}
::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:${T.slate};border-radius:3px;}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideInR{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
@keyframes slideInL{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
@keyframes popIn{from{opacity:0;transform:scale(0.7) rotate(-10deg)}60%{transform:scale(1.1) rotate(2deg)}to{opacity:1;transform:scale(1) rotate(0)}}
@keyframes confetti{0%{transform:translateY(-100vh) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
@keyframes typing{0%,60%{opacity:.3}30%{opacity:1}}
@keyframes slideSheet{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
input,textarea,button,select{font-family:'Sora',sans-serif;}
button{transition:transform .12s ease, filter .15s ease;}
button:not(:disabled):hover{filter:brightness(1.08);}
button:not(:disabled):active{transform:scale(0.97);}
input:focus,textarea:focus{border-color:${T.flame}66 !important;}
/* App column: full-bleed on phones, a framed centered app on larger screens. */
.app-shell{width:100%;max-width:480px;margin:0 auto;}
@media (min-width:520px){
  body{background:radial-gradient(ellipse at 50% -10%, ${T.flame}12, transparent 55%), #05050c;}
  .app-shell{border-left:1px solid ${T.glassBorder};border-right:1px solid ${T.glassBorder};box-shadow:0 0 120px rgba(0,0,0,0.65);}
  .app-overlay{padding:0;}
}
/* Full-screen overlays (Edit Profile, Chat) center their panel instead of stretching. */
.app-overlay{position:fixed;inset:0;display:flex;justify-content:center;}
.app-overlay > .app-panel{width:100%;max-width:480px;height:100%;display:flex;flex-direction:column;overflow:hidden;}
@media (min-width:520px){
  .app-overlay > .app-panel{border-left:1px solid ${T.glassBorder};border-right:1px solid ${T.glassBorder};box-shadow:0 0 120px rgba(0,0,0,0.7);}
}
`;
