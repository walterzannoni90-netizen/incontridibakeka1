import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://incontridibakeka.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: "Server non configurato" }, 500);
  }
  if (!authHeader || !token) return json({ error: "Non autorizzato" }, 401);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Token non valido" }, 401);

  try {
    const body = await req.json() as {
      ad_id?: string;
      type?: string;
      duration_days?: number;
      start_at?: string | null;
    };

    if (!body.ad_id || !body.type || !Number.isInteger(body.duration_days)) {
      return json({ error: "ID annuncio, tipo e durata sono obbligatori" }, 400);
    }

    const { data, error } = await supabase.rpc("purchase_ad_boost", {
      p_ad_id: body.ad_id,
      p_type: body.type,
      p_duration_days: body.duration_days,
      p_start_at: body.start_at ?? null,
    });

    if (error) return json({ error: error.message || "Errore boost" }, 400);
    return json({ boost: Array.isArray(data) ? data[0] : data });
  } catch (error) {
    console.error("Errore boost:", error instanceof Error ? error.message : error);
    return json({ error: "Errore interno" }, 500);
  }
});
