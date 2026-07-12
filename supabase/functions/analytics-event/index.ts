import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://incontridibakeka.com").replace(/\/$/, "");

const allowedEvents = new Set([
  "page_view", "sign_up", "login", "ad_publish", "contact_open",
  "checkout_start", "checkout_created", "payment_completed", "share",
]);

function headers(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin === SITE_URL ? origin : SITE_URL,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin")?.replace(/\/$/, "") ?? null;
  if (origin && origin !== SITE_URL) {
    return new Response(JSON.stringify({ error: "Origin non autorizzata" }), { status: 403, headers: headers(null) });
  }
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(origin) });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: headers(origin) });
  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
    return new Response(JSON.stringify({ error: "Server non configurato" }), { status: 500, headers: headers(origin) });
  }

  try {
    const body = await req.json() as Record<string, unknown>;
    const eventName = typeof body.event_name === "string" ? body.event_name : "";
    const path = typeof body.path === "string" ? body.path.slice(0, 300) : "/";
    const visitorId = typeof body.visitor_id === "string" ? body.visitor_id.slice(0, 100) : "";
    const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};
    if (!allowedEvents.has(eventName) || !visitorId || JSON.stringify(metadata).length > 2000) {
      return new Response(JSON.stringify({ error: "Evento non valido" }), { status: 400, headers: headers(origin) });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const recent = await admin
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("visitor_id", visitorId)
      .gte("created_at", new Date(Date.now() - 60_000).toISOString());
    if ((recent.count ?? 0) >= 20) {
      return new Response(JSON.stringify({ accepted: true }), { status: 202, headers: headers(origin) });
    }

    let userId: string | null = null;
    const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (token) {
      const authClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
      const { data } = await authClient.auth.getUser(token);
      userId = data.user?.id ?? null;
    }

    const { error } = await admin.from("analytics_events").insert({
      event_name: eventName,
      path,
      visitor_id: visitorId,
      user_id: userId,
      metadata,
    });
    if (error) throw error;
    return new Response(JSON.stringify({ accepted: true }), { status: 202, headers: headers(origin) });
  } catch (error) {
    console.error("analytics-event:", error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ error: "Evento non registrato" }), { status: 500, headers: headers(origin) });
  }
});
