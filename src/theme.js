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
/* App frame: full-bleed single column on phones; sidebar + wide content on desktop. */
.app-frame{width:100%;max-width:600px;margin:0 auto;height:100vh;display:flex;flex-direction:column;}
.app-column{flex:1;min-width:0;min-height:0;overflow:hidden;}
.app-sidebar{display:none;}
@media (min-width:640px) and (max-width:959px){
  body{background:radial-gradient(ellipse at 50% -10%, ${T.flame}12, transparent 55%), #05050c;}
  .app-frame{border-left:1px solid ${T.glassBorder};border-right:1px solid ${T.glassBorder};box-shadow:0 0 120px rgba(0,0,0,0.65);}
}
@media (min-width:960px){
  body{background:radial-gradient(ellipse at 50% -10%, ${T.flame}12, transparent 55%), #05050c;}
  .app-frame{flex-direction:row;max-width:1080px;border-left:1px solid ${T.glassBorder};border-right:1px solid ${T.glassBorder};box-shadow:0 0 140px rgba(0,0,0,0.7);}
  .app-sidebar{display:flex;flex-direction:column;width:230px;flex-shrink:0;padding:20px 12px 14px;border-right:1px solid ${T.glassBorder};height:100vh;box-sizing:border-box;}
  .app-column{height:100vh;}
  .app-topbar{display:none !important;}
  .app-bottomnav{display:none !important;}
}
/* Keep the legacy .app-shell class working if referenced elsewhere. */
.app-shell{width:100%;max-width:600px;margin:0 auto;}
/* Full-screen overlays (Edit Profile, Chat) center their panel instead of stretching. */
.app-overlay{position:fixed;inset:0;display:flex;justify-content:center;}
.app-overlay > .app-panel{width:100%;max-width:600px;height:100%;display:flex;flex-direction:column;overflow:hidden;}
@media (min-width:640px){
  .app-overlay > .app-panel{border-left:1px solid ${T.glassBorder};border-right:1px solid ${T.glassBorder};box-shadow:0 0 120px rgba(0,0,0,0.7);}
}
/* Edit Profile: single column on phones, two columns on wider screens. */
.edit-grid{display:flex;flex-direction:column;}
@media (min-width:600px){
  .edit-grid{display:grid;grid-template-columns:1fr 1fr;column-gap:22px;align-items:start;}
}
/* Skeleton shimmer for loading states. */
@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
.shimmer{background:linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 75%);background-size:800px 100%;animation:shimmer 1.4s infinite linear;}
/* Landing page. */
.landing-hero{display:flex;gap:56px;align-items:center;justify-content:space-between;}
.landing-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.landing-stats{display:flex;gap:72px;justify-content:center;flex-wrap:wrap;}
@media (max-width:980px){
  .landing-hero{flex-direction:column;gap:40px;text-align:center;}
  .landing-hero h1{font-size:44px !important;}
  .landing-cards{grid-template-columns:repeat(2,1fr);}
}
@media (max-width:560px){
  .landing-cards{grid-template-columns:1fr;}
  .landing-hero h1{font-size:36px !important;}
  .landing-stats{gap:36px;}
}
/* Readable legal / document pages (own scroll container: body is overflow:hidden). */
.doc-page{height:100vh;overflow-y:auto;box-sizing:border-box;padding:32px 20px 64px;}
.doc-inner{max-width:720px;margin:0 auto;}
.doc-inner h1{font-family:'Fraunces',serif;font-size:30px;margin-bottom:6px;}
.doc-inner h2{font-family:'Fraunces',serif;font-size:19px;margin:26px 0 8px;color:${T.coral};}
.doc-inner p,.doc-inner li{color:${T.mist};font-size:14px;line-height:1.7;}
.doc-inner ul{margin:6px 0 6px 18px;}
.doc-inner li{margin-bottom:4px;}
.doc-inner a{color:${T.coral};}
`;
