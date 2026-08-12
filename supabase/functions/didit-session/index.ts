// Creates a Didit identity-verification session for the signed-in user and
// records the pending kyc_verifications row. The client only ever receives
// the hosted-flow URL — the Didit API key stays server-side.
//
// Deploy WITH JWT verification (default): callers must be signed-in users.
//   supabase functions deploy didit-session

import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://baddies.travel",
  "https://www.baddies.travel",
  "http://localhost:3000",
];

const ID_TYPES = ["passport", "national_id", "drivers_licence"];

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
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: cors });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Not signed in" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let idType = "";
  try {
    const body = await req.json();
    idType = body.id_type;
  } catch { /* validation below */ }
  if (!ID_TYPES.includes(idType)) {
    return new Response(JSON.stringify({ error: "Invalid id_type" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // The user returns to /verify after the hosted flow.
  const callbackOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  const diditRes = await fetch("https://verification.didit.me/v3/session/", {
    method: "POST",
    headers: {
      "x-api-key": Deno.env.get("DIDIT_API_KEY")!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workflow_id: Deno.env.get("DIDIT_WORKFLOW_ID")!,
      vendor_data: user.id,
      callback: `${callbackOrigin}/verify`,
      language: "en",
    }),
  });
  if (!diditRes.ok) {
    console.error("didit session create failed", diditRes.status, await diditRes.text());
    return new Response(
      JSON.stringify({ error: "Verification provider unavailable" }),
      { status: 502, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
  const session = await diditRes.json();

  // Record the pending verification (service role — clients cannot insert).
  const admin = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { error } = await admin.from("kyc_verifications").insert({
    user_id: user.id,
    provider: "didit",
    provider_ref: session.session_id,
    id_type: idType,
    status: "pending",
  });
  if (error) {
    console.error("kyc_verifications insert failed", error);
    return new Response(JSON.stringify({ error: "Could not record verification" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
