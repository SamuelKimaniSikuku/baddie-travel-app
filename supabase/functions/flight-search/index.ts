// ═══════════════════════════════════════════════════════════════
// FLIGHT SEARCH — Supabase Edge Function (Deno)
// ───────────────────────────────────────────────────────────────
// Proxies the Amadeus Flight Offers Search API so the API secret
// never reaches the browser. The frontend calls this function via
// supabase.functions.invoke('flight-search', { body: {...} }).
//
// Required secrets (set with the Supabase CLI, NOT in .env):
//   supabase secrets set AMADEUS_CLIENT_ID=xxxx
//   supabase secrets set AMADEUS_CLIENT_SECRET=xxxx
//   # optional, defaults to the free test host:
//   supabase secrets set AMADEUS_HOST=test.api.amadeus.com
//
// Deploy:
//   supabase functions deploy flight-search
// ═══════════════════════════════════════════════════════════════

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const HOST = Deno.env.get("AMADEUS_HOST") || "test.api.amadeus.com";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// Cache the OAuth token in module scope so warm invocations skip re-auth.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  const id = Deno.env.get("AMADEUS_CLIENT_ID");
  const secret = Deno.env.get("AMADEUS_CLIENT_SECRET");
  if (!id || !secret) throw new Error("missing_amadeus_credentials");

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const res = await fetch(`https://${HOST}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: id,
      client_secret: secret,
    }),
  });
  if (!res.ok) throw new Error("amadeus_auth_failed");
  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 1799) * 1000,
  };
  return cachedToken.value;
}

// Turn ISO-8601 duration "PT7H30M" into "7h 30m".
function fmtDuration(iso?: string): string {
  if (!iso) return "";
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return "";
  const h = m[1] ? `${m[1]}h` : "";
  const min = m[2] ? `${m[2]}m` : "";
  return [h, min].filter(Boolean).join(" ");
}

// "2026-07-15T08:25:00" -> "08:25"
function fmtTime(at?: string): string {
  if (!at) return "";
  const t = at.split("T")[1] || "";
  return t.slice(0, 5);
}

// Summarize one itinerary (leg) into flat fields.
function legSummary(itin: any) {
  const segs = itin?.segments || [];
  const first = segs[0];
  const last = segs[segs.length - 1];
  if (!first || !last) return null;
  return {
    carrierCode: first.carrierCode,
    flightNumber: `${first.carrierCode} ${first.number}`,
    from: first.departure?.iataCode || "",
    to: last.arrival?.iataCode || "",
    departTime: fmtTime(first.departure?.at),
    arriveTime: fmtTime(last.arrival?.at),
    date: (first.departure?.at || "").split("T")[0] || "",
    duration: fmtDuration(itin?.duration),
    stops: Math.max(0, segs.length - 1),
  };
}

function normalize(offer: any, carriers: Record<string, string>) {
  const out = legSummary(offer.itineraries?.[0]);
  if (!out) return null;
  const ret = offer.itineraries?.[1] ? legSummary(offer.itineraries[1]) : null;

  return {
    id: offer.id,
    airline: carriers[out.carrierCode] || out.carrierCode,
    flight_number: out.flightNumber,
    from: out.from,
    to: out.to,
    fromCity: out.from,
    toCity: out.to,
    departTime: out.departTime,
    arriveTime: out.arriveTime,
    date: out.date,
    duration: out.duration,
    stops: out.stops,
    price: parseFloat(offer.price?.grandTotal || offer.price?.total || "0"),
    currency: offer.price?.currency || "USD",
    // Round-trip return leg (null for one-way).
    roundTrip: !!ret,
    returnFlightNumber: ret ? ret.flightNumber : null,
    returnDepartTime: ret ? ret.departTime : null,
    returnArriveTime: ret ? ret.arriveTime : null,
    returnDate: ret ? ret.date : null,
    returnDuration: ret ? ret.duration : null,
    returnStops: ret ? ret.stops : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const origin = (body.origin || "").trim().toUpperCase();
  const destination = (body.destination || "").trim().toUpperCase();
  const date = (body.date || "").trim(); // YYYY-MM-DD
  const returnDate = (body.returnDate || "").trim(); // optional YYYY-MM-DD
  const adults = Math.min(Math.max(parseInt(body.adults, 10) || 1, 1), 9);
  const currency = (body.currency || "USD").toUpperCase();

  // Basic validation: IATA codes are 3 letters; date must be ISO.
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
    return json({ error: "invalid_iata", message: "Use 3-letter airport codes, e.g. CDG, DPS." }, 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: "invalid_date", message: "Date must be YYYY-MM-DD." }, 400);
  }
  if (returnDate && !/^\d{4}-\d{2}-\d{2}$/.test(returnDate)) {
    return json({ error: "invalid_return_date", message: "Return date must be YYYY-MM-DD." }, 400);
  }
  if (returnDate && returnDate < date) {
    return json({ error: "return_before_depart", message: "Return date must be on or after departure." }, 400);
  }

  try {
    const token = await getToken();
    const url = new URL(`https://${HOST}/v2/shopping/flight-offers`);
    url.searchParams.set("originLocationCode", origin);
    url.searchParams.set("destinationLocationCode", destination);
    url.searchParams.set("departureDate", date);
    if (returnDate) url.searchParams.set("returnDate", returnDate);
    url.searchParams.set("adults", String(adults));
    url.searchParams.set("currencyCode", currency);
    url.searchParams.set("max", "12");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!res.ok) {
      const detail = data?.errors?.[0]?.detail || "search_failed";
      return json({ error: "amadeus_error", message: detail }, 502);
    }

    const carriers: Record<string, string> = data?.dictionaries?.carriers || {};
    const results = (data?.data || [])
      .map((o: any) => normalize(o, carriers))
      .filter(Boolean)
      .sort((a: any, b: any) => a.price - b.price);

    return json({ results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown_error";
    const status = msg === "missing_amadeus_credentials" ? 503 : 500;
    return json({ error: msg }, status);
  }
});
