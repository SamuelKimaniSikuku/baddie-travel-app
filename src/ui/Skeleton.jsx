// ══════════════════════════════════════════════════════════════
// Skeleton — shimmering placeholder blocks for loading states.
// ══════════════════════════════════════════════════════════════

export default function Skeleton({ width, height, radius, style }) {
  return <div className="shimmer" style={{ width: width || "100%", height: height || 14,
    borderRadius: radius == null ? 8 : radius, ...style }} />;
}

// A chat-list row placeholder (avatar + two lines).
export function RowSkeleton() {
  return <div style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 0" }}>
    <Skeleton width={48} height={48} radius="50%" style={{ flexShrink:0 }} />
    <div style={{ flex:1 }}>
      <Skeleton width="45%" height={13} style={{ marginBottom:8 }} />
      <Skeleton width="75%" height={11} />
    </div>
  </div>;
}

// A trip-card placeholder.
export function CardSkeleton() {
  return <div style={{ borderRadius:16, border:"1px solid rgba(255,255,255,0.06)", padding:16, marginBottom:10 }}>
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
      <Skeleton width={30} height={30} radius={8} style={{ flexShrink:0 }} />
      <div style={{ flex:1 }}>
        <Skeleton width="40%" height={14} style={{ marginBottom:7 }} />
        <Skeleton width="28%" height={10} />
      </div>
      <Skeleton width={62} height={20} radius={8} />
    </div>
    <Skeleton width="55%" height={11} />
  </div>;
}
