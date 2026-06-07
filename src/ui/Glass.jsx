import { T } from "../theme";

export default function Glass({ children, style, onClick }) {
  return <div onClick={onClick} style={{
    background:T.glass, backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
    border:"1px solid "+T.glassBorder, borderRadius:16, ...style
  }}>{children}</div>;
}
