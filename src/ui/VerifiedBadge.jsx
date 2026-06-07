import { T } from "../theme";

export default function VerifiedBadge({ size, title }) {
  var s = size || 16;
  return <span title={title || "Identity verified"} style={{
    display:"inline-flex", alignItems:"center", justifyContent:"center",
    width:s, height:s, borderRadius:"50%", background:T.sky, color:T.white,
    fontSize:s*0.62, fontWeight:800, flexShrink:0 }}>✓</span>;
}
