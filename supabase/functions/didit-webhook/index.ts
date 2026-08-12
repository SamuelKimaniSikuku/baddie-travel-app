// Didit webhook receiver. Deploy WITHOUT JWT verification (Didit is not a
// Supabase user); authenticity is proven by the HMAC signature instead:
//   supabase functions deploy didit-webhook --no-verify-jwt
//
// X-Signature is HMAC-SHA256 of the exact raw request bytes with the webhook
// secret, and X-Timestamp must be within 5 minutes.
//
// On status.updated: Approved -> status='verified' and profiles.verified=true;
// Declined/Expired/Abandoned -> 'rejected'; In Review -> 'in_review'. A face
// already verified on ANOTHER account is auto-declined as duplicate_account.

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  duplicateOfSession,
  fetchDecision,
  updateSessionStatus,
} from "../_shared/didit.ts";

const encoder = new TextEncoder();

async function hmacHex(secret: string, data: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    "raw", encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", k, encoder.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Canonical JSON for Didit's X-Signature-V2: recursively sorted keys, compact
// separators, unicode preserved. JS JSON.stringify already emits compact,
// unicode-preserving output and normalizes whole-valued floats (1.0 -> 1) via
// parse, so we only need to sort keys.
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort()) {
      out[k] = sortKeys((v as Record<string, unknown>)[k]);
    }
    return out;
  }
  return v;
}

// Didit statuses are title-case ("In Review", "Kyc Expired"); normalize to be
// safe against case differences across webhook versions.
const STATUS_MAP: Record<string, "verified" | "rejected" | "in_review"> = {
  "approved": "verified",
  "declined": "rejected",
  "expired": "rejected",
  "kyc expired": "rejected",
  "abandoned": "rejected",
  "in review": "in_review",
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const raw = await req.text();
  const secret = Deno.env.get("DIDIT_WEBHOOK_SECRET")!;
  const sigV2 = req.headers.get("x-signature-v2");
  const sigRaw = req.headers.get("x-signature");
  const timestamp = req.headers.get("x-timestamp");

  if ((!sigV2 && !sigRaw) || !timestamp) {
    return new Response("Missing signature", { status: 401 });
  }
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp, 10)) > 300) {
    return new Response("Stale timestamp", { status: 401 });
  }

  // Prefer X-Signature-V2 (canonical JSON), fall back to raw-body X-Signature.
  let valid = false;
  if (sigV2) {
    try {
      const canonical = JSON.stringify(sortKeys(JSON.parse(raw)));
      valid = timingSafeEqual(await hmacHex(secret, canonical), sigV2);
    } catch { /* fall through */ }
  }
  if (!valid && sigRaw) {
    valid = timingSafeEqual(await hmacHex(secret, raw), sigRaw);
  }
  if (!valid) return new Response("Invalid signature", { status: 401 });

  // Parse defensively: fields may be top-level (v3 identity) or nested under
  // `data`, and the type key may be `webhook_type` or `event`.
  let parsed: Record<string, any>;
  try { parsed = JSON.parse(raw); } catch { return new Response("Bad payload", { status: 400 }); }
  const data = (parsed.data && typeof parsed.data === "object") ? parsed.data : parsed;
  const eventType = parsed.webhook_type ?? parsed.event;
  const sessionId = data.session_id ?? parsed.session_id;
  const statusStr = data.status ?? parsed.status;

  if (eventType !== "status.updated" || !sessionId) {
    return new Response(JSON.stringify({ ok: true, ignored: true }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }

  const newStatus = STATUS_MAP[String(statusStr ?? "").toLowerCase()];
  if (!newStatus) {
    return new Response(JSON.stringify({ ok: true, interim: statusStr }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }
  const body = { session_id: sessionId };

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: updated, error } = await admin
    .from("kyc_verifications")
    .update({
      status: newStatus,
      resolved_at: newStatus === "in_review" ? null : new Date().toISOString(),
    })
    .eq("provider", "didit")
    .eq("provider_ref", body.session_id)
    .select("user_id");
  if (error) {
    console.error("kyc_verifications update failed", error);
    return new Response("DB error", { status: 500 });
  }

  const userId = updated?.[0]?.user_id;
  if (newStatus === "verified" && userId) {
    const { error: pErr } = await admin
      .from("profiles").update({ verified: true }).eq("id", userId);
    if (pErr) { console.error("profiles update failed", pErr); return new Response("DB error", { status: 500 }); }
  }

  // Auto-decline a face already verified on ANOTHER account.
  if (newStatus === "in_review" && userId) {
    const dupSession = duplicateOfSession(await fetchDecision(body.session_id));
    if (dupSession) {
      const { data: other } = await admin
        .from("kyc_verifications")
        .select("user_id")
        .eq("provider_ref", dupSession)
        .eq("status", "verified")
        .maybeSingle();

      if (other?.user_id && other.user_id !== userId) {
        const { error: dErr } = await admin
          .from("kyc_verifications")
          .update({
            status: "rejected",
            decline_reason: "duplicate_account",
            resolved_at: new Date().toISOString(),
          })
          .eq("provider", "didit")
          .eq("provider_ref", body.session_id);
        if (dErr) console.error("auto-decline update failed", dErr);

        await updateSessionStatus(
          body.session_id, "Declined",
          "Auto-declined: this face is already verified on another account.",
        );
        return new Response(JSON.stringify({ ok: true, auto: "duplicate_account" }), {
          status: 200, headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
