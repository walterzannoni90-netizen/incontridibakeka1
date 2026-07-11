import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://incontridibakeka.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": SITE_URL.replace(/\/$/, ""),
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
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return json({ error: "Server non configurato" }, 500);
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? url.pathname.split("/").pop();
  const authHeader = req.headers.get("authorization");
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });

  try {
    if (action === "register") {
      const body = await req.json() as {
        email?: string;
        password?: string;
        name?: string;
        phone?: string;
      };
      const email = body.email?.trim().toLowerCase();
      const name = body.name?.trim();

      if (!email || !body.password || !name) {
        return json({ error: "Email, password e nome sono obbligatori" }, 400);
      }
      if (body.password.length < 8 || body.password.length > 128) {
        return json({ error: "La password deve contenere tra 8 e 128 caratteri" }, 400);
      }
      if (name.length > 100) return json({ error: "Nome troppo lungo" }, 400);

      const { data, error } = await anonClient.auth.signUp({
        email,
        password: body.password,
        options: {
          emailRedirectTo: SITE_URL,
          data: { name, phone: body.phone?.trim() || null },
        },
      });
      if (error || !data.user) {
        return json({ error: error?.message || "Registrazione non riuscita" }, 400);
      }

      return json({
        message: "Registrazione completata. Controlla la tua email.",
        user: { id: data.user.id, email: data.user.email, name },
        requires_email_confirmation: !data.session,
      }, 201);
    }

    if (action === "login") {
      const body = await req.json() as { email?: string; password?: string };
      if (!body.email || !body.password) {
        return json({ error: "Email e password sono obbligatori" }, 400);
      }

      const { data, error } = await anonClient.auth.signInWithPassword({
        email: body.email.trim().toLowerCase(),
        password: body.password,
      });
      if (error || !data.user || !data.session) {
        return json({ error: "Credenziali non valide" }, 401);
      }

      const { data: profile } = await anonClient
        .from("profiles")
        .select("id,email,name,is_admin,credits,has_paid,subscription_tier,ads_count,is_verified")
        .eq("id", data.user.id)
        .single();

      return json({ user: profile, token: data.session.access_token });
    }

    const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return json({ error: "Non autorizzato" }, 401);

    const { data: userData, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Token non valido" }, 401);

    if (action === "me") {
      const { data: profile, error } = await anonClient
        .from("profiles")
        .select("id,email,name,phone,is_admin,credits,has_paid,subscription_tier,ads_count,is_verified")
        .eq("id", userData.user.id)
        .single();
      if (error) return json({ error: "Profilo non trovato" }, 404);
      return json({ user: profile });
    }

    if (action === "profile") {
      const body = await req.json() as Record<string, unknown>;
      const updates: Record<string, unknown> = {};
      for (const field of ["name", "phone", "whatsapp", "avatar_url"] as const) {
        if (body[field] !== undefined) updates[field] = body[field];
      }
      if (typeof updates.name === "string" && updates.name.trim().length > 100) {
        return json({ error: "Nome troppo lungo" }, 400);
      }
      updates.updated_at = new Date().toISOString();

      const { data, error } = await anonClient
        .from("profiles")
        .update(updates)
        .eq("id", userData.user.id)
        .select()
        .single();
      if (error) return json({ error: "Errore aggiornamento profilo" }, 400);
      return json({ user: data });
    }

    return json({ error: "Azione non valida" }, 400);
  } catch (error) {
    console.error("Errore auth-api:", error instanceof Error ? error.message : error);
    return json({ error: "Errore interno" }, 500);
  }
});
