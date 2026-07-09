import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPA_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("VITE_SUPABASE_ANON_KEY")!;

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 204, headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || url.pathname.split("/").pop();

  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const anonClient = createClient(SUPABASE_URL, SUPA_ANON_KEY, {
    auth: { persistSession: false },
  });

  try {
    if (action === "register") {
      const { email, password, name, phone } = await req.json();
      if (!email || !password || !name) {
        return json({ error: "Email, password e nome sono obbligatori" }, 400);
      }
      if (password.length < 8) {
        return json({ error: "La password deve essere di almeno 8 caratteri" }, 400);
      }

      const { data: existing } = await supabaseClient
        .from("profiles")
        .select("email")
        .eq("email", email)
        .maybeSingle();
      if (existing) return json({ error: "Email già registrata" }, 409);

      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { name },
      });
      if (authError || !authData?.user) {
        return json({ error: authError?.message || "Errore creazione utente" }, 400);
      }

      const { error: profileError } = await supabaseClient.from("profiles").insert({
        id: authData.user.id, email, name, phone: phone || null,
        credits: 20, subscription_tier: "free", has_paid: false,
        ads_count: 0, is_admin: false, is_verified: false,
      });
      if (profileError) {
        await supabaseClient.auth.admin.deleteUser(authData.user.id);
        return json({ error: "Errore creazione profilo" }, 500);
      }
      return json({ message: "Registrazione completata!", user: { id: authData.user.id, email, name } }, 201);
    }

    if (action === "login") {
      const { email, password } = await req.json();
      if (!email || !password) return json({ error: "Email e password sono obbligatori" }, 400);

      const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({ email, password });
      if (authError || !authData?.user) return json({ error: "Credenziali non valide" }, 401);

      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      return json({
        user: {
          id: authData.user.id, email: authData.user.email,
          name: profile?.name, is_admin: profile?.is_admin || false,
          credits: profile?.credits || 0, has_paid: profile?.has_paid || false,
          subscription_tier: profile?.subscription_tier || "free",
          ads_count: profile?.ads_count || 0, is_verified: profile?.is_verified || false,
        },
        token: authData.session?.access_token,
      });
    }

    if (action === "me") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ error: "Non autorizzato" }, 401);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await anonClient.auth.getUser(token);
      if (!user) return json({ error: "Token non valido" }, 401);

      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      return json({
        user: {
          id: user.id, email: user.email, name: profile?.name,
          is_admin: profile?.is_admin || false, credits: profile?.credits || 0,
          has_paid: profile?.has_paid || false,
          subscription_tier: profile?.subscription_tier || "free",
          ads_count: profile?.ads_count || 0, is_verified: profile?.is_verified || false,
        },
      });
    }

    if (action === "profile") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ error: "Non autorizzato" }, 401);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await anonClient.auth.getUser(token);
      if (!user) return json({ error: "Token non valido" }, 401);

      const body = await req.json();
      const updates: Record<string, any> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.phone !== undefined) updates.phone = body.phone;
      if (body.whatsapp !== undefined) updates.whatsapp = body.whatsapp;
      if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabaseClient
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();
      if (error) return json({ error: "Errore aggiornamento profilo" }, 500);
      return json({ user: data });
    }

    return json({ error: "Azione non valida" }, 400);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Errore interno";
    return json({ error: msg }, 500);
  }
});