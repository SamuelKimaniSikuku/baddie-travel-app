import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

// ═══════════════════════════════════════════════════════════════
// BADDIE — Admin Dashboard
// Route: /admin (protect with ADMIN_EMAIL check)
// ═══════════════════════════════════════════════════════════════

const ADMIN_EMAILS = ["YOUR_REAL_EMAIL_HERE@gmail.com", "explorer@baddie.app"]; // Add your email here

const C = {
  bg: "#0A0A14", card: "#14142B", border: "rgba(255,255,255,0.08)",
  flame: "#FF4136", sunset: "#FF8C42", gold: "#FFB830",
  mint: "#00D4AA", violet: "#A78BFA", sky: "#38BDF8",
  rose: "#FF3B6F", lime: "#84CC16", ash: "#6E6E8A",
  mist: "#A0A0BE", white: "#FFFFFF", slate: "#2D2D48",
};

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ padding: "16px", borderRadius: 16, background: C.card, border: `1px solid ${C.border}`, flex: 1, minWidth: 140 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 11, color: C.ash, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || C.white, fontFamily: "serif" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.ash, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: color + "22", color, border: `1px solid ${color}44`, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

// ── Users Tab ─────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }

  async function banUser(id) {
    await supabase.from("profiles").update({ banned: true }).eq("id", id);
    loadUsers();
  }

  async function unbanUser(id) {
    await supabase.from("profiles").update({ banned: false }).eq("id", id);
    loadUsers();
  }

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    if (filter === "verified") return matchSearch && u.verified;
    if (filter === "premium") return matchSearch && u.plan && u.plan !== "free";
    if (filter === "banned") return matchSearch && u.banned;
    return matchSearch;
  });

  return (
    <div>
      {/* Search + Filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search users..."
          style={{ flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.white, fontSize: 13, outline: "none" }} />
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "verified", "premium", "banned"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${filter === f ? C.flame : C.border}`, background: filter === f ? C.flame + "22" : C.card, color: filter === f ? C.flame : C.ash, fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{f}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: C.ash }}>Loading users...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(u => (
            <div key={u.id} style={{ padding: "14px 16px", borderRadius: 14, background: C.card, border: `1px solid ${selected === u.id ? C.flame + "55" : C.border}`, cursor: "pointer" }} onClick={() => setSelected(selected === u.id ? null : u.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.slate, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {u.avatar || "😎"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{u.name || "Unknown"}</span>
                    {u.verified && <Badge text="✅ Verified" color={C.mint} />}
                    {u.plan && u.plan !== "free" && <Badge text={u.plan === "pro" ? "👑 Pro" : "✈️ Nomad"} color={C.gold} />}
                    {u.banned && <Badge text="🚫 Banned" color={C.rose} />}
                  </div>
                  <div style={{ fontSize: 11, color: C.ash, marginTop: 2 }}>{u.city || "No city"} · Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</div>
                </div>
                <div style={{ fontSize: 11, color: C.mist }}>{u.vibe || "—"}</div>
              </div>

              {selected === u.id && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12, fontSize: 12 }}>
                    <div><span style={{ color: C.ash }}>Email: </span><span>{u.email || "—"}</span></div>
                    <div><span style={{ color: C.ash }}>Budget: </span><span>{u.budget || "—"}</span></div>
                    <div><span style={{ color: C.ash }}>Destination: </span><span>{u.destination || "—"}</span></div>
                    <div><span style={{ color: C.ash }}>Verify status: </span><span>{u.verify_status || "unverified"}</span></div>
                    <div><span style={{ color: C.ash }}>Super likes: </span><span>{u.super_likes ?? "—"}</span></div>
                    <div><span style={{ color: C.ash }}>Plan: </span><span>{u.plan || "free"}</span></div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {!u.banned ? (
                      <button onClick={e => { e.stopPropagation(); banUser(u.id); }} style={{ padding: "7px 14px", borderRadius: 10, border: `1px solid ${C.rose}44`, background: C.rose + "18", color: C.rose, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>🚫 Ban User</button>
                    ) : (
                      <button onClick={e => { e.stopPropagation(); unbanUser(u.id); }} style={{ padding: "7px 14px", borderRadius: 10, border: `1px solid ${C.mint}44`, background: C.mint + "18", color: C.mint, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>✅ Unban User</button>
                    )}
                    <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(u.id); }} style={{ padding: "7px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.slate + "44", color: C.mist, fontSize: 11, cursor: "pointer" }}>📋 Copy ID</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.ash }}>No users found</div>}
        </div>
      )}
    </div>
  );
}

// ── Verifications Tab ─────────────────────────────────────────
function VerificationsTab() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState("pending");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("verifications")
      .select("*, profiles(name, avatar, city, email)")
      .order("submitted_at", { ascending: false });
    setSubs(data || []);
    setLoading(false);
  }

  async function updateStatus(id, userId, status) {
    setProcessing(true);
    await supabase.from("verifications").update({
      status, notes: note, reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    await load();
    setSelected(null);
    setNote("");
    setProcessing(false);
  }

  const statusColor = { pending: C.gold, verified: C.mint, rejected: C.rose };
  const filtered = subs.filter(s => filter === "all" || s.status === filter);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["pending", "verified", "rejected", "all"].map(f => {
          const count = f === "all" ? subs.length : subs.filter(s => s.status === f).length;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${filter === f ? (statusColor[f] || C.flame) : C.border}`, background: filter === f ? (statusColor[f] || C.flame) + "22" : C.card, color: filter === f ? (statusColor[f] || C.flame) : C.ash, fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
              {f} ({count})
            </button>
          );
        })}
      </div>

      {loading ? <div style={{ textAlign: "center", padding: 40, color: C.ash }}>Loading...</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(sub => (
            <div key={sub.id} style={{ borderRadius: 14, background: C.card, border: `1px solid ${selected === sub.id ? C.flame + "55" : C.border}`, overflow: "hidden" }}>
              <div onClick={() => setSelected(selected === sub.id ? null : sub.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.slate, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  {sub.profiles?.avatar || "😎"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{sub.profiles?.name || "Unknown"}</div>
                  <div style={{ fontSize: 11, color: C.ash }}>{sub.doc_type?.replace(/_/g, " ")} · {new Date(sub.submitted_at).toLocaleDateString()}</div>
                </div>
                <Badge text={sub.status} color={statusColor[sub.status] || C.ash} />
              </div>

              {selected === sub.id && (
                <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${C.border}` }}>
                  <div style={{ display: "grid", gridTemplateColumns: sub.back_path ? "1fr 1fr 1fr" : "1fr 1fr", gap: 10, margin: "14px 0" }}>
                    {[{ url: sub.front_path, label: "Front" }, sub.back_path && { url: sub.back_path, label: "Back" }, { url: sub.selfie_path, label: "Selfie" }].filter(Boolean).map(img => (
                      <div key={img.label}>
                        <p style={{ fontSize: 10, color: C.ash, marginBottom: 6, textAlign: "center" }}>{img.label}</p>
                        <div style={{ borderRadius: 10, overflow: "hidden", background: C.slate, aspectRatio: "3/4", position: "relative" }}>
                          <img src={img.url} alt={img.label} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                          <div style={{ display: "none", position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", color: C.ash, fontSize: 11 }}>No image</div>
                        </div>
                        <a href={img.url} target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", fontSize: 10, color: C.sky, marginTop: 4 }}>Open full size ↗</a>
                      </div>
                    ))}
                  </div>

                  <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a review note (optional)..."
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.white, fontSize: 12, outline: "none", resize: "none", minHeight: 70, marginBottom: 12 }} />

                  {sub.status === "pending" && (
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => updateStatus(sub.id, sub.user_id, "verified")} disabled={processing}
                        style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${C.mint},${C.lime})`, color: "#0A0A14", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        ✅ Approve
                      </button>
                      <button onClick={() => updateStatus(sub.id, sub.user_id, "rejected")} disabled={processing}
                        style={{ flex: 1, padding: "11px", borderRadius: 12, border: `1px solid ${C.rose}44`, background: C.rose + "18", color: C.rose, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        ❌ Reject
                      </button>
                    </div>
                  )}
                  {sub.status !== "pending" && (
                    <div style={{ padding: "10px 12px", borderRadius: 10, background: C.slate + "44", fontSize: 11, color: C.mist }}>
                      Reviewed {sub.reviewed_at ? new Date(sub.reviewed_at).toLocaleDateString() : "—"}
                      {sub.notes && ` · Note: ${sub.notes}`}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.ash }}>No {filter} verifications</div>}
        </div>
      )}
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────
function AnalyticsTab({ stats }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en", { weekday: "short" });
  });

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
        <StatCard icon="👥" label="Total Users" value={stats.totalUsers} sub="All time" color={C.sky} />
        <StatCard icon="❤️" label="Total Matches" value={stats.totalMatches} sub="All time" color={C.flame} />
        <StatCard icon="💬" label="Messages" value={stats.totalMessages} sub="All time" color={C.violet} />
        <StatCard icon="✅" label="Verified" value={stats.verifiedUsers} sub={`${stats.totalUsers > 0 ? Math.round(stats.verifiedUsers / stats.totalUsers * 100) : 0}% of users`} color={C.mint} />
        <StatCard icon="👑" label="Premium" value={stats.premiumUsers} sub="Paid subscribers" color={C.gold} />
        <StatCard icon="🗺️" label="Trips" value={stats.totalTrips} sub="Planned" color={C.lime} />
      </div>

      {/* Simple bar chart */}
      <div style={{ padding: "16px", borderRadius: 16, background: C.card, border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 14 }}>Signups (last 7 days)</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
          {days.map((day, i) => {
            const h = Math.floor(Math.random() * 100);
            return (
              <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", height: h + "%", background: `linear-gradient(to top,${C.flame},${C.sunset})`, borderRadius: "4px 4px 0 0", minHeight: 4 }} />
                <span style={{ fontSize: 9, color: C.ash }}>{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top destinations */}
      <div style={{ padding: "16px", borderRadius: 16, background: C.card, border: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Top Destinations</p>
        {[
          { name: "Bali", emoji: "🇮🇩", count: 12 },
          { name: "Tokyo", emoji: "🇯🇵", count: 9 },
          { name: "Morocco", emoji: "🇲🇦", count: 7 },
          { name: "Greece", emoji: "🇬🇷", count: 6 },
          { name: "Vietnam", emoji: "🇻🇳", count: 5 },
        ].map((d, i) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ fontSize: 16 }}>{d.emoji}</span>
            <span style={{ flex: 1, fontSize: 13 }}>{d.name}</span>
            <div style={{ height: 6, width: `${d.count * 6}px`, background: `linear-gradient(90deg,${C.flame},${C.sunset})`, borderRadius: 3 }} />
            <span style={{ fontSize: 11, color: C.ash, minWidth: 20, textAlign: "right" }}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Reports Tab ───────────────────────────────────────────────
function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("reports")
        .select("*, reporter:profiles!reporter_id(name, avatar), reported:profiles!reported_id(name, avatar)")
        .order("created_at", { ascending: false });
      setReports(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      {loading ? <div style={{ textAlign: "center", padding: 40, color: C.ash }}>Loading...</div> : (
        reports.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🎉</div>
            <p style={{ color: C.ash, fontSize: 13 }}>No reports yet — community is behaving!</p>
          </div>
        ) : reports.map(r => (
          <div key={r.id} style={{ padding: "14px 16px", borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{r.reporter?.name || "User"} reported {r.reported?.name || "User"}</div>
                <div style={{ fontSize: 11, color: C.ash, marginTop: 3 }}>{r.reason} · {new Date(r.created_at).toLocaleDateString()}</div>
                {r.details && <div style={{ fontSize: 11, color: C.mist, marginTop: 6, lineHeight: 1.5 }}>{r.details}</div>}
              </div>
              <Badge text={r.status || "open"} color={r.status === "resolved" ? C.mint : C.gold} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────
export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState("analytics");
  const [stats, setStats] = useState({ totalUsers: 0, totalMatches: 0, totalMessages: 0, verifiedUsers: 0, premiumUsers: 0, totalTrips: 0 });

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      setUser(session.user);
      const email = session.user.email;
      if (ADMIN_EMAILS.includes(email)) {
        setAuthorized(true);
        loadStats();
      }
      setLoading(false);
    }
    init();
  }, []);

  async function loadStats() {
    const [users, matches, messages, verified, premium, trips] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("matches").select("id", { count: "exact" }),
      supabase.from("messages").select("id", { count: "exact" }),
      supabase.from("profiles").select("id", { count: "exact" }).eq("verified", true),
      supabase.from("profiles").select("id", { count: "exact" }).neq("plan", "free"),
      supabase.from("trips").select("id", { count: "exact" }),
    ]);
    setStats({
      totalUsers: users.count || 0,
      totalMatches: matches.count || 0,
      totalMessages: messages.count || 0,
      verifiedUsers: verified.count || 0,
      premiumUsers: premium.count || 0,
      totalTrips: trips.count || 0,
    });
  }

  const TABS = [
    { id: "analytics", label: "📊 Analytics" },
    { id: "users",     label: "👥 Users" },
    { id: "verify",    label: "🛡️ Verifications" },
    { id: "reports",   label: "🚩 Reports" },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: C.ash }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>⏳</div>
        <p>Loading admin dashboard...</p>
      </div>
    </div>
  );

  if (!user) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <h2 style={{ color: C.white, marginBottom: 8 }}>Admin Access</h2>
        <p style={{ color: C.ash, marginBottom: 24 }}>Please sign in to access the admin dashboard</p>
        <a href="/" style={{ padding: "12px 24px", borderRadius: 12, background: `linear-gradient(135deg,${C.flame},${C.sunset})`, color: C.white, textDecoration: "none", fontWeight: 600 }}>Go to App →</a>
      </div>
    </div>
  );

  if (!authorized) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⛔</div>
        <h2 style={{ color: C.rose, marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: C.ash, marginBottom: 24 }}>You don't have admin privileges for this app.</p>
        <p style={{ color: C.ash, fontSize: 12 }}>Signed in as: {user.email}</p>
        <a href="/" style={{ display: "inline-block", marginTop: 16, padding: "12px 24px", borderRadius: 12, background: C.slate, color: C.white, textDecoration: "none" }}>← Back to App</a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Sora', sans-serif", color: C.white }}>
      {/* Top bar */}
      <div style={{ padding: "14px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.card, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>✈️</span>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Baddie Admin</h1>
            <p style={{ fontSize: 10, color: C.ash, margin: 0 }}>Signed in as {user.email}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={loadStats} style={{ padding: "7px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.mist, fontSize: 11, cursor: "pointer" }}>🔄 Refresh</button>
          <a href="/" style={{ padding: "7px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.mist, fontSize: 11, textDecoration: "none" }}>← App</a>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
        {/* Tab nav */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 18px", borderRadius: 12, border: `1px solid ${tab === t.id ? C.flame : C.border}`, background: tab === t.id ? C.flame + "22" : C.card, color: tab === t.id ? C.flame : C.ash, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "analytics"  && <AnalyticsTab stats={stats} />}
        {tab === "users"      && <UsersTab />}
        {tab === "verify"     && <VerificationsTab />}
        {tab === "reports"    && <ReportsTab />}
      </div>
    </div>
  );
}
