import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, PATCH, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Non autorizzato" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json({ error: "Token non valido" }, 401);
    const userId = user.id;

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const adId = pathParts[pathParts.length - 1];
    if (!adId) return json({ error: "ID annuncio mancante" }, 400);

    const { type, duration_days, credits } = await req.json();
    if (!type || !duration_days || !credits) {
      return json({ error: "Tipo, durata e crediti sono obbligatori" }, 400);
    }

    const { data: ad } = await supabase
      .from("ads")
      .select("user_id")
      .eq("id", adId)
      .single();
    if (!ad) return json({ error: "Annuncio non trovato" }, 404);
    if (ad.user_id !== userId) return json({ error: "Non autorizzato" }, 403);

    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();
    if (!profile || (profile.credits || 0) < credits) {
      return json({ error: "Crediti insufficienti" }, 402);
    }

    const now = new Date();
    const endAt = new Date(now.getTime() + duration_days * 24 * 60 * 60 * 1000);

    const { data: updatedAd, error: updateError } = await supabase
      .from("ads")
      .update({
        is_premium: type === "premium",
        is_sponsored: type === "sponsored" || type === "vetrina",
        boost_type: type,
        boost_start_at: now.toISOString(),
        boost_end_at: endAt.toISOString(),
      })
      .eq("id", adId)
      .select()
      .single();
    if (updateError) return json({ error: "Errore boost annuncio" }, 500);

    await supabase
      .from("profiles")
      .update({ credits: (profile.credits || 0) - credits })
      .eq("id", userId);

    await supabase.from("ad_boosts").insert({
      ad_id: adId, user_id: userId, type, duration_days,
      start_at: now.toISOString(), end_at: endAt.toISOString(),
      credits_used: credits,
    });

    return json({ ad: updatedAd, message: "Boost applicato con successo" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Errore interno";
    return json({ error: msg }, 500);
  }
});