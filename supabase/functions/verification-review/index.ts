// The review queue's backend. Two actions, both admin-only:
//   { action: "list" }                       -> sessions waiting on a person
//   { action: "decide", id, decision, note } -> approve or decline one
//
// Runs with the service role (a reviewer needs rows RLS hides from ordinary
// users, and mirroring the decision at Didit needs the API key). Admin status
// is checked on every call against the caller's OWN JWT via profiles.is_admin
// — never against anything in the request body.
//
// Deploy: supabase functions deploy verification-review

import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchDecision, updateSessionStatus } from "../_shared/didit.ts";

const ALLOWED_ORIGINS = [
  "https://baddies.travel",
  "https://www.baddies.travel",
  "http://localhost:3000",
];

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin":
      origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

  const authHeader = req.headers.get("Authorization") ?? "";
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: userRes } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
  const uid = userRes?.user?.id;
  if (!uid) return json({ error: "Not signed in" }, 401);

  const { data: me } = await admin
    .from("profiles").select("is_admin").eq("id", uid).maybeSingle();
  if (!me?.is_admin) return json({ error: "Not allowed" }, 403);

  let body: { action?: string; id?: string; decision?: string; note?: string };
  try { body = await req.json(); } catch { return json({ error: "Bad payload" }, 400); }

  // ── list ──
  if (body.action === "list") {
    const { data: rows, error } = await admin
      .from("kyc_verifications")
      .select("id, user_id, provider_ref, id_type, status, created_at")
      .eq("status", "in_review")
      .order("created_at", { ascending: true })
      .limit(50);
    if (error) return json({ error: error.message }, 500);

    // Collapse duplicate rows for one Didit session.
    const seen = new Set<string>();
    const unique = (rows ?? []).filter((r) => {
      const k = r.provider_ref ?? r.id;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const items = await Promise.all(
      unique.map(async (r) => {
        const [{ data: profile }, decision] = await Promise.all([
          admin.from("profiles").select("name, created_at, verified").eq("id", r.user_id).maybeSingle(),
          fetchDecision(r.provider_ref ?? ""),
        ]);
        const warnings: string[] = [];
        for (const feature of ["id_verification", "liveness", "face_match"]) {
          const block = (decision ?? {})[feature] as { warnings?: { short_description?: string }[] } | undefined;
          for (const w of block?.warnings ?? []) if (w.short_description) warnings.push(w.short_description);
        }
        return {
          id: r.id,
          sessionId: r.provider_ref,
          idType: r.id_type,
          submittedAt: r.created_at,
          name: profile?.name ?? "Unknown",
          memberSince: profile?.created_at ?? null,
          alreadyVerified: profile?.verified ?? false,
          warnings,
        };
      }),
    );
    return json({ items });
  }

  // ── decide ──
  if (body.action === "decide") {
    const approve = body.decision === "approve";
    if (!body.id || (body.decision !== "approve" && body.decision !== "decline")) {
      return json({ error: "Bad payload" }, 400);
    }

    const { data: row } = await admin
      .from("kyc_verifications")
      .select("id, user_id, provider_ref, status")
      .eq("id", body.id)
      .maybeSingle();
    if (!row) return json({ error: "Not found" }, 404);
    if (row.status !== "in_review") return json({ error: `Already ${row.status}` }, 409);

    const target = admin.from("kyc_verifications").update({
      status: approve ? "verified" : "rejected",
      decline_reason: approve ? null : (body.note?.slice(0, 200) || "manual_review"),
      resolved_at: new Date().toISOString(),
    });
    const { error: uErr } = row.provider_ref
      ? await target.eq("provider_ref", row.provider_ref)
      : await target.eq("id", row.id);
    if (uErr) return json({ error: uErr.message }, 500);

    if (approve) {
      const { error: pErr } = await admin
        .from("profiles").update({ verified: true }).eq("id", row.user_id);
      if (pErr) return json({ error: pErr.message }, 500);
    }

    const mirrored = row.provider_ref
      ? await updateSessionStatus(
          row.provider_ref, approve ? "Approved" : "Declined",
          body.note?.slice(0, 200) || "Reviewed in Baddie admin",
        )
      : { ok: false, detail: "no session id" };

    return json({ ok: true, mirroredToDidit: mirrored.ok, detail: mirrored.detail });
  }

  return json({ error: "Unknown action" }, 400);
});
